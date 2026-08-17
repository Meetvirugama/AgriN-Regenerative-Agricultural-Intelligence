#!/usr/bin/env python3
"""
AgriMesh Confidence Calibration — Section 18 (P1)
==================================================
Temperature scaling calibration for a trained model.

Why calibration matters (Section 18):
  Deep neural networks are often overconfident.
  A model saying "98% confident" may be wrong 30% of the time.
  Temperature scaling finds a single scalar T to divide logits by,
  making the probability distribution better match actual accuracy.

Measures:
  - ECE (Expected Calibration Error) before and after scaling
  - Reliability diagram (calibration curve)
  - NLL (Negative Log-Likelihood)

Saves:
  data/models/<crop>/calibration.json  — T value + validation ECE
  reports/calibration/<crop>_<model>/calibration_report.md

Usage:
  python ml/calibration/temperature_scaling.py --crop tomato --model efficientnet_b0

Requires: torch torchvision scikit-learn numpy pillow
"""

import argparse
import csv
import io
import json
import zipfile
from pathlib import Path

import numpy as np

ROOT        = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT / "dataset"
SPLITS_DIR  = ROOT / "data" / "splits"
MODELS_DIR  = ROOT / "data" / "models"
REPORTS_DIR = ROOT / "reports" / "calibration"

ZIP_PATHS = {
    "data.zip":                    DATASET_DIR / "data.zip",
    "PlantDoc-Dataset-master.zip": DATASET_DIR / "PlantDoc-Dataset-master.zip",
}

# Number of calibration histogram bins
N_BINS = 15


def load_logits_from_val(model, class_to_idx, transform, device, val_records, batch_size=32):
    """
    Run model on validation set. Return raw logits + true labels.
    Calibration MUST use the validation set, NEVER the test set.
    """
    import torch
    from PIL import Image

    model.eval()
    all_logits = []
    all_labels = []

    zip_handles = {}

    def get_zip(zip_name):
        if zip_name not in zip_handles:
            p = ZIP_PATHS.get(zip_name)
            if p and p.exists():
                zip_handles[zip_name] = zipfile.ZipFile(p, "r")
        return zip_handles.get(zip_name)

    batch_imgs, batch_labels = [], []

    def flush():
        if not batch_imgs:
            return
        imgs = torch.stack(batch_imgs).to(device)
        with torch.no_grad():
            logits = model(imgs)
        all_logits.append(logits.cpu())
        all_labels.extend(batch_labels)
        batch_imgs.clear()
        batch_labels.clear()

    for rec in val_records:
        z = get_zip(rec["zip"])
        if not z:
            continue
        label_idx = class_to_idx.get(rec["canonical_id"])
        if label_idx is None:
            continue
        try:
            data = z.read(rec["internal_path"])
            img  = io.BytesIO(data)
            img  = __import__("PIL").Image.open(img).convert("RGB")
            if transform:
                img = transform(img)
            batch_imgs.append(img)
            batch_labels.append(label_idx)
            if len(batch_imgs) >= batch_size:
                flush()
        except Exception:
            pass

    flush()
    for z in zip_handles.values():
        z.close()

    import torch
    logits = torch.cat(all_logits, dim=0)
    labels = torch.tensor(all_labels, dtype=torch.long)
    return logits, labels


def compute_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = N_BINS) -> float:
    """
    Expected Calibration Error (Section 18).
    Lower is better. Perfect calibration = 0.
    """
    confidences = probs.max(axis=1)
    predictions = probs.argmax(axis=1)
    correctness = (predictions == labels).astype(float)

    ece = 0.0
    for i in range(n_bins):
        lo = i / n_bins
        hi = (i + 1) / n_bins
        mask = (confidences > lo) & (confidences <= hi)
        if mask.sum() > 0:
            bin_acc  = correctness[mask].mean()
            bin_conf = confidences[mask].mean()
            ece += mask.sum() * abs(bin_conf - bin_acc)

    return float(ece / len(labels))


def find_temperature(logits, labels, lr=0.01, max_iter=100):
    """
    Optimize temperature T by minimizing NLL on the validation set.
    Returns the optimal scalar T.
    """
    import torch
    import torch.nn.functional as F

    T = torch.nn.Parameter(torch.ones(1) * 1.5)
    optimizer = torch.optim.LBFGS([T], lr=lr, max_iter=max_iter)

    def eval_nll():
        optimizer.zero_grad()
        scaled  = logits / T
        nll     = F.cross_entropy(scaled, labels)
        nll.backward()
        return nll

    optimizer.step(eval_nll)

    # Clamp to prevent degenerate solutions
    T_val = float(T.clamp(0.05, 10.0).item())
    return T_val


def reliability_diagram_data(probs: np.ndarray, labels: np.ndarray, n_bins: int = N_BINS):
    """Returns (mean_confidence, fraction_correct) per bin for plotting."""
    confidences = probs.max(axis=1)
    predictions = probs.argmax(axis=1)
    correctness = (predictions == labels).astype(float)

    bin_confs, bin_accs, bin_counts = [], [], []
    for i in range(n_bins):
        lo   = i / n_bins
        hi   = (i + 1) / n_bins
        mask = (confidences > lo) & (confidences <= hi)
        if mask.sum() > 0:
            bin_confs.append(float(confidences[mask].mean()))
            bin_accs.append(float(correctness[mask].mean()))
            bin_counts.append(int(mask.sum()))

    return bin_confs, bin_accs, bin_counts


def write_calibration_report(crop, model_name, T, ece_before, ece_after, bin_data, out_dir):
    path = out_dir / "calibration_report.md"
    with open(path, "w") as f:
        f.write(f"# Calibration Report — {crop} / {model_name}\n\n")
        f.write(f"## Temperature Scaling\n\n")
        f.write(f"| | ECE |\n|---|---|\n")
        f.write(f"| Before calibration | {ece_before:.4f} |\n")
        f.write(f"| After calibration (T={T:.4f}) | {ece_after:.4f} |\n\n")

        if ece_after < ece_before:
            f.write(f"✓ Calibration improved ECE by {ece_before - ece_after:.4f}\n\n")
        else:
            f.write(f"⚠ Calibration did not improve ECE — review val set or training.\n\n")

        f.write(f"## Reliability Diagram Data\n\n")
        f.write(f"| Bin confidence | Fraction correct | Count |\n|---|---|---|\n")
        for conf, acc, cnt in zip(*bin_data):
            flag = " ⚠" if abs(conf - acc) > 0.1 else ""
            f.write(f"| {conf:.3f} | {acc:.3f} | {cnt}{flag} |\n")

        f.write(f"\n## Usage\n\n")
        f.write(f"At inference time, divide model logits by T={T:.4f} before softmax.\n")
        f.write(f"The calibration.json artifact stores this value for the inference service.\n")

    print(f"  Calibration report → {path.name}")


def main():
    import torch
    import torch.nn.functional as F

    parser = argparse.ArgumentParser()
    parser.add_argument("--crop",  default="tomato")
    parser.add_argument("--model", default="efficientnet_b0")
    parser.add_argument("--batch", type=int, default=32)
    args = parser.parse_args()

    print("=" * 60)
    print(f"AgriMesh Calibration — {args.crop} / {args.model}")
    print("=" * 60)

    # Import training helpers
    import sys
    sys.path.insert(0, str(ROOT))
    from ml.training.train_baseline import build_model, get_transforms, load_split, build_class_index

    # Load experiment config
    exp_base = ROOT / "reports" / "experiments"
    matches  = sorted(exp_base.glob(f"exp_{args.model}_{args.crop}_*/config.json"), reverse=True)
    if not matches:
        raise FileNotFoundError("No experiment config found. Run train_baseline.py first.")
    with open(matches[0]) as f:
        cfg = json.load(f)

    class_to_idx = cfg["class_to_idx"]
    num_classes  = cfg["num_classes"]
    image_size   = cfg.get("image_size", 224)

    device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"

    # Load model
    ckpt_path = MODELS_DIR / args.crop / f"{args.model}_best.pt"
    model     = build_model(args.model, num_classes)
    model.load_state_dict(torch.load(ckpt_path, map_location=device))
    model = model.to(device)

    transform = get_transforms(image_size, augment=False)

    # Get logits from val set
    val_records = load_split(SPLITS_DIR / args.crop / "val.csv")
    print(f"  Val set: {len(val_records):,} records")

    logits, labels = load_logits_from_val(model, class_to_idx, transform, device, val_records, args.batch)

    # Metrics BEFORE calibration
    probs_before = torch.softmax(logits, dim=1).numpy()
    ece_before   = compute_ece(probs_before, labels.numpy())
    print(f"  ECE before: {ece_before:.4f}")

    # Find optimal temperature
    T = find_temperature(logits.clone(), labels.clone())
    print(f"  Optimal temperature T = {T:.4f}")

    # Metrics AFTER calibration
    probs_after = torch.softmax(logits / T, dim=1).numpy()
    ece_after   = compute_ece(probs_after, labels.numpy())
    print(f"  ECE after:  {ece_after:.4f}")

    # Reliability diagram data (post-calibration)
    bin_data = reliability_diagram_data(probs_after, labels.numpy())

    # Save calibration artifact
    out_dir = REPORTS_DIR / f"{args.crop}_{args.model}"
    out_dir.mkdir(parents=True, exist_ok=True)
    write_calibration_report(args.crop, args.model, T, ece_before, ece_after, bin_data, out_dir)

    # Save calibration.json inference artifact (Section 47.1)
    calib_artifact = MODELS_DIR / args.crop / "calibration.json"
    with open(calib_artifact, "w") as f:
        json.dump({
            "_meta": "Temperature scaling calibration. Applied at inference: logits / T before softmax.",
            "temperature": round(T, 6),
            "ece_before":  round(ece_before, 6),
            "ece_after":   round(ece_after, 6),
            "n_val_samples": int(len(labels)),
            "model": args.model,
            "crop":  args.crop,
        }, f, indent=2)

    print(f"  Calibration artifact → {calib_artifact}")
    print(f"\n✓ Done. Next: deploy model with calibration.json loaded.")


if __name__ == "__main__":
    main()
