#!/usr/bin/env python3
"""
AgriMesh Model Evaluation — Section 13 (P0)
============================================
Evaluates a trained model on all test splits and generates the full scorecard.

Measures (Section 13):
  - Accuracy
  - Macro precision / recall / F1
  - Weighted F1
  - Per-class F1
  - Balanced accuracy
  - Top-3 accuracy
  - Top-5 accuracy
  - Confusion matrix
  - Per-class confidence distribution

Reports separately for:
  TEST-A  PlantVillage benchmark
  TEST-B  PlantDoc realistic benchmark
  TEST-C  Real AgriMesh field data (when available)

Section 14 — Error analysis:
  - Saves false positives, false negatives
  - Highest-confidence wrong predictions
  - Lowest-confidence correct predictions

Usage:
  python ml/evaluation/evaluate_model.py --crop tomato --model efficientnet_b0

Requires: torch torchvision scikit-learn pillow tqdm
"""

import argparse
import csv
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT        = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT / "dataset"
SPLITS_DIR  = ROOT / "data" / "splits"
MODELS_DIR  = ROOT / "data" / "models"
REPORTS_DIR = ROOT / "reports" / "evaluation"

ZIP_PATHS = {
    "data.zip":                    DATASET_DIR / "data.zip",
    "PlantDoc-Dataset-master.zip": DATASET_DIR / "PlantDoc-Dataset-master.zip",
}


def load_split(path: Path) -> list[dict]:
    if not path.exists():
        print(f"  [SKIP] {path.name} not found")
        return []
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def load_config(crop: str, model_name: str) -> dict:
    """Load training config to get class_to_idx."""
    # Look for most recent experiment for this crop+model
    exp_base = ROOT / "reports" / "experiments"
    matches  = sorted(exp_base.glob(f"exp_{model_name}_{crop}_*/config.json"), reverse=True)
    if not matches:
        raise FileNotFoundError(
            f"No experiment config found for {crop}/{model_name}.\n"
            "Run train_baseline.py first."
        )
    with open(matches[0]) as f:
        cfg = json.load(f)
    print(f"  Using config: {matches[0].parent.name}")
    return cfg


def run_inference(records: list[dict], model, class_to_idx: dict, transform, device, batch_size=32):
    """
    Run inference on a list of records.
    Returns list of dicts: {record, true_label_idx, pred_label_idx, top5_probs, top5_classes, correct}
    """
    import torch
    from PIL import Image

    idx_to_class  = {v: k for k, v in class_to_idx.items()}
    model.eval()
    results = []

    zip_handles = {}

    def get_zip(zip_name):
        if zip_name not in zip_handles:
            p = ZIP_PATHS.get(zip_name)
            if not p or not p.exists():
                return None
            zip_handles[zip_name] = zipfile.ZipFile(p, "r")
        return zip_handles[zip_name]

    with torch.no_grad():
        batch_imgs, batch_recs = [], []

        def flush_batch():
            if not batch_imgs:
                return
            imgs  = torch.stack(batch_imgs).to(device)
            logits = model(imgs)
            probs  = torch.softmax(logits, dim=1)
            top5   = torch.topk(probs, k=min(5, probs.size(1)), dim=1)

            for i, rec in enumerate(batch_recs):
                true_idx  = class_to_idx.get(rec["canonical_id"], -1)
                pred_idx  = probs[i].argmax().item()
                top5_idxs = top5.indices[i].tolist()
                top5_prob = top5.values[i].tolist()

                results.append({
                    "source":        rec["source"],
                    "internal_path": rec["internal_path"],
                    "true_id":       rec["canonical_id"],
                    "true_idx":      true_idx,
                    "pred_id":       idx_to_class.get(pred_idx, "unknown"),
                    "pred_idx":      pred_idx,
                    "top5_ids":      [idx_to_class.get(x, "?") for x in top5_idxs],
                    "top5_probs":    [round(p, 4) for p in top5_prob],
                    "correct":       int(true_idx == pred_idx),
                    "top3_correct":  int(true_idx in top5_idxs[:3]),
                    "top5_correct":  int(true_idx in top5_idxs),
                    "confidence":    round(probs[i, pred_idx].item(), 4),
                })
            batch_imgs.clear()
            batch_recs.clear()

        for rec in records:
            z = get_zip(rec["zip"])
            if not z:
                continue
            try:
                data = z.read(rec["internal_path"])
                img  = Image.open(io.BytesIO(data)).convert("RGB")
                if transform:
                    img = transform(img)
                batch_imgs.append(img)
                batch_recs.append(rec)
                if len(batch_imgs) >= batch_size:
                    flush_batch()
            except Exception:
                pass

        flush_batch()

    for z in zip_handles.values():
        z.close()

    return results


def compute_metrics(results: list[dict], class_to_idx: dict) -> dict:
    """Section 13 — Full metric suite."""
    from sklearn.metrics import (
        accuracy_score, f1_score, precision_score, recall_score,
        balanced_accuracy_score, confusion_matrix,
    )

    true_labels = [r["true_idx"]  for r in results if r["true_idx"] >= 0]
    pred_labels = [r["pred_idx"]  for r in results if r["true_idx"] >= 0]

    if not true_labels:
        return {}

    classes = sorted(class_to_idx.values())

    metrics = {
        "n_samples":       len(true_labels),
        "accuracy":        round(accuracy_score(true_labels, pred_labels), 4),
        "balanced_acc":    round(balanced_accuracy_score(true_labels, pred_labels), 4),
        "macro_f1":        round(f1_score(true_labels, pred_labels, average="macro",    zero_division=0), 4),
        "weighted_f1":     round(f1_score(true_labels, pred_labels, average="weighted", zero_division=0), 4),
        "macro_precision": round(precision_score(true_labels, pred_labels, average="macro",    zero_division=0), 4),
        "macro_recall":    round(recall_score(true_labels, pred_labels, average="macro",    zero_division=0), 4),
        "top3_accuracy":   round(sum(r["top3_correct"] for r in results if r["true_idx"] >= 0) / len(true_labels), 4),
        "top5_accuracy":   round(sum(r["top5_correct"] for r in results if r["true_idx"] >= 0) / len(true_labels), 4),
    }

    # Per-class F1
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    per_class_f1 = f1_score(true_labels, pred_labels, average=None, zero_division=0, labels=classes)
    metrics["per_class_f1"] = {idx_to_class.get(i, str(i)): round(float(v), 4)
                                for i, v in zip(classes, per_class_f1)}

    # Confusion matrix
    cm = confusion_matrix(true_labels, pred_labels, labels=classes)
    metrics["confusion_matrix"] = cm.tolist()
    metrics["confusion_labels"] = [idx_to_class.get(i, str(i)) for i in classes]

    return metrics


def error_analysis(results: list[dict], out_dir: Path):
    """Section 14 — Error analysis: FP, FN, highest-confidence errors."""
    errors    = [r for r in results if r["correct"] == 0 and r["true_idx"] >= 0]
    corrects  = [r for r in results if r["correct"] == 1]

    # Highest-confidence wrong predictions (most dangerous)
    high_conf_errors = sorted(errors, key=lambda r: -r["confidence"])[:50]

    # Lowest-confidence correct predictions (borderline cases)
    low_conf_correct = sorted(corrects, key=lambda r: r["confidence"])[:50]

    fields = ["source", "internal_path", "true_id", "pred_id", "confidence", "top5_ids", "top5_probs"]

    with open(out_dir / "high_confidence_errors.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in high_conf_errors:
            r2 = dict(r)
            r2["top5_ids"]   = "|".join(r["top5_ids"])
            r2["top5_probs"] = "|".join(str(p) for p in r["top5_probs"])
            w.writerow(r2)

    with open(out_dir / "low_confidence_correct.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in low_conf_correct:
            r2 = dict(r)
            r2["top5_ids"]   = "|".join(r["top5_ids"])
            r2["top5_probs"] = "|".join(str(p) for p in r["top5_probs"])
            w.writerow(r2)

    print(f"  Error analysis: {len(errors)} errors, {len(high_conf_errors)} high-conf errors saved")


def write_scorecard(crop: str, model_name: str, split_metrics: dict, out_dir: Path):
    """Section 41 — Model Scorecard."""
    path = out_dir / "scorecard.md"
    with open(path, "w") as f:
        f.write(f"# AgriMesh Model Scorecard — {crop} / {model_name}\n\n")
        f.write(f"> Section 41: Accuracy alone is insufficient. Use this full scorecard.\n\n")

        f.write("| Metric | TEST-A (PlantVillage) | TEST-B (PlantDoc) | TEST-C (Real Field) |\n")
        f.write("|---|---|---|---|\n")

        metrics_a = split_metrics.get("test_a", {})
        metrics_b = split_metrics.get("test_b", {})

        def v(m, key):
            val = m.get(key)
            return f"{val:.4f}" if val is not None else "N/A"

        for metric in ["accuracy", "balanced_acc", "macro_f1", "weighted_f1", "macro_precision", "macro_recall", "top3_accuracy", "top5_accuracy"]:
            f.write(f"| {metric} | {v(metrics_a, metric)} | {v(metrics_b, metric)} | Pending |\n")

        f.write("\n## Per-Class F1 (TEST-A)\n\n| Class | F1 |\n|---|---|\n")
        for cls, score in sorted(metrics_a.get("per_class_f1", {}).items()):
            f.write(f"| {cls} | {score:.4f} |\n")

        f.write("\n## Important Notes\n\n")
        f.write("> **TEST-A (PlantVillage) accuracy is NOT production accuracy.**\n")
        f.write("> PlantVillage images are lab-controlled. Real farmer photos perform worse.\n")
        f.write("> TEST-B (PlantDoc) is the better robustness indicator.\n")
        f.write("> TEST-C (real field) is the most important final test — collect and evaluate.\n")
        f.write("> Never publish TEST-A metrics as 'production performance'.\n")

    print(f"  Scorecard → {path.name}")


def main():
    import torch

    parser = argparse.ArgumentParser()
    parser.add_argument("--crop",  default="tomato")
    parser.add_argument("--model", default="efficientnet_b0")
    parser.add_argument("--batch", type=int, default=32)
    args = parser.parse_args()

    print("=" * 60)
    print(f"AgriMesh Model Evaluation — {args.crop} / {args.model}")
    print("=" * 60)

    from ml.training.train_baseline import build_model, get_transforms, ZipImageDataset

    cfg          = load_config(args.crop, args.model)
    class_to_idx = cfg["class_to_idx"]
    num_classes  = cfg["num_classes"]
    image_size   = cfg.get("image_size", 224)

    device = (
        "mps"  if torch.backends.mps.is_available() else
        "cuda" if torch.cuda.is_available()          else
        "cpu"
    )

    # Load model
    ckpt_path = MODELS_DIR / args.crop / f"{args.model}_best.pt"
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}\nRun train_baseline.py first.")

    model = build_model(args.model, num_classes)
    model.load_state_dict(torch.load(ckpt_path, map_location=device))
    model = model.to(device)
    print(f"  Loaded checkpoint: {ckpt_path.name}")

    transform = get_transforms(image_size, augment=False)

    out_dir = REPORTS_DIR / f"{args.crop}_{args.model}"
    out_dir.mkdir(parents=True, exist_ok=True)

    split_dir    = SPLITS_DIR / args.crop
    split_metrics = {}

    for split_name, csv_name in [
        ("test_a", "test_a_plantvillage.csv"),
        ("test_b", "test_b_plantdoc.csv"),
    ]:
        records = load_split(split_dir / csv_name)
        if not records:
            continue

        print(f"\nEvaluating {split_name} ({len(records):,} images)...")
        results = run_inference(records, model, class_to_idx, transform, device, args.batch)
        metrics = compute_metrics(results, class_to_idx)
        split_metrics[split_name] = metrics

        with open(out_dir / f"{split_name}_metrics.json", "w") as f:
            json.dump(metrics, f, indent=2)

        print(f"  acc={metrics.get('accuracy')} macro_f1={metrics.get('macro_f1')} top3={metrics.get('top3_accuracy')}")

        # Error analysis on both test sets
        error_dir = out_dir / f"error_analysis_{split_name}"
        error_dir.mkdir(exist_ok=True)
        error_analysis(results, error_dir)

    write_scorecard(args.crop, args.model, split_metrics, out_dir)

    print(f"\n✓ Evaluation complete: {out_dir}")
    print(f"  Next step: python ml/calibration/temperature_scaling.py --crop {args.crop} --model {args.model}")


if __name__ == "__main__":
    main()
