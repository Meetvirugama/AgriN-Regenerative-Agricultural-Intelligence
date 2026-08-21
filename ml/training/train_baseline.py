#!/usr/bin/env python3
"""
AgriMesh Training Baseline — Sections 10, 11 (P0)
=================================================
Transfer learning on PlantVillage + PlantDoc using EfficientNet-B0.

Pipeline:
  1. Load crop manifest (data/splits/<crop>/train.csv)
  2. Extract images from ZIP on-the-fly (no full extraction needed)
  3. Phase 1: Freeze backbone, train classification head
  4. Phase 2: Unfreeze top layers, fine-tune with lower LR
  5. Save best checkpoint based on validation macro-F1
  6. Write experiment report to reports/experiments/

Hardware: Mac M2 8 GB for small experiments / final evaluation.
          Use free Cloud GPU (Kaggle / Google Colab) for full training.

Usage:
  python ml/training/train_baseline.py --crop tomato --model efficientnet_b0 --epochs 20
  python ml/training/train_baseline.py --crop tomato --model mobilenet_v3   --epochs 20

Requires: torch torchvision pillow tqdm scikit-learn
  pip install torch torchvision torchaudio pillow tqdm scikit-learn
"""

import argparse
import csv
import io
import json
import os
import random
import time
import zipfile
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# These imports are lazy so the file can be inspected without torch installed
ROOT         = Path(__file__).resolve().parents[2]
DATASET_DIR  = ROOT / "dataset"
SPLITS_DIR   = ROOT / "data" / "splits"
MODELS_DIR   = ROOT / "data" / "models"
REPORTS_DIR  = ROOT / "reports" / "experiments"

ZIP_PATHS = {
    "data.zip":                    DATASET_DIR / "data.zip",
    "PlantDoc-Dataset-master.zip": DATASET_DIR / "PlantDoc-Dataset-master.zip",
}


# ── Dataset ────────────────────────────────────────────────────────────────────
class ZipImageDataset:
    """
    Reads images directly from ZIP without full extraction.
    Memory-efficient: loads one image at a time.
    """

    def __init__(self, records: list[dict], class_to_idx: dict, transform=None):
        self.records      = records
        self.class_to_idx = class_to_idx
        self.transform    = transform
        self._zip_handles = {}

    def _get_zip(self, zip_name: str):
        import os
        pid = os.getpid()
        key = (pid, zip_name)
        if key not in self._zip_handles:
            path = ZIP_PATHS.get(zip_name)
            if not path or not path.exists():
                raise FileNotFoundError(f"ZIP not found: {zip_name}")
            self._zip_handles[key] = zipfile.ZipFile(path, "r")
        return self._zip_handles[key]

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        from PIL import Image
        import torch

        rec = self.records[idx]
        z   = self._get_zip(rec["zip"])
        data = z.read(rec["internal_path"])
        img  = Image.open(io.BytesIO(data)).convert("RGB")

        if self.transform:
            img = self.transform(img)

        label = self.class_to_idx[rec["canonical_id"]]
        return img, label

    def __del__(self):
        for z in self._zip_handles.values():
            z.close()


def load_split(split_csv: Path) -> list[dict]:
    if not split_csv.exists():
        raise FileNotFoundError(f"Split CSV not found: {split_csv}\nRun data_split.py first.")
    with open(split_csv, newline="") as f:
        return list(csv.DictReader(f))


def build_class_index(train_records: list[dict]) -> dict:
    classes = sorted(set(r["canonical_id"] for r in train_records))
    return {cls: i for i, cls in enumerate(classes)}


# ── Transforms ────────────────────────────────────────────────────────────────
def get_transforms(image_size: int = 224, augment: bool = True):
    """
    Section 9 — Realistic Augmentation (training only).
    Validation/test: NO augmentation.
    """
    try:
        from torchvision import transforms
    except ImportError:
        raise ImportError("torchvision required: pip install torchvision")

    mean = [0.485, 0.456, 0.406]
    std  = [0.229, 0.224, 0.225]

    if augment:
        return transforms.Compose([
            transforms.Resize((image_size + 32, image_size + 32)),
            transforms.RandomCrop(image_size),
            transforms.RandomHorizontalFlip(p=0.5),
            # Biologically plausible for plant leaves
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(
                brightness=0.2, contrast=0.2, saturation=0.1, hue=0.05
            ),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std),
        ])
    else:
        # Validation / test — NO augmentation
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std),
        ])


# ── Model builder ─────────────────────────────────────────────────────────────
def build_model(model_name: str, num_classes: int):
    """
    Sections 10-11 — Build pretrained model + replace classification head.
    Supports: efficientnet_b0, efficientnet_b2, mobilenet_v3_small, convnext_tiny
    """
    try:
        import torch
        import torch.nn as nn
        from torchvision import models
    except ImportError:
        raise ImportError("torch/torchvision required: pip install torch torchvision")

    print(f"  Building model: {model_name} ({num_classes} classes)")

    if model_name == "efficientnet_b0":
        m = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, num_classes)

    elif model_name == "efficientnet_b2":
        m = models.efficientnet_b2(weights=models.EfficientNet_B2_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, num_classes)

    elif model_name == "mobilenet_v3":
        m = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
        m.classifier[3] = nn.Linear(m.classifier[3].in_features, num_classes)

    elif model_name == "convnext_tiny":
        m = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1)
        m.classifier[2] = nn.Linear(m.classifier[2].in_features, num_classes)

    else:
        raise ValueError(f"Unknown model: {model_name}. Choose: efficientnet_b0, efficientnet_b2, mobilenet_v3, convnext_tiny")

    return m


def freeze_backbone(model, model_name: str):
    """Phase 1: freeze backbone, train head only."""
    for name, param in model.named_parameters():
        if "classifier" not in name and "head" not in name:
            param.requires_grad = False


def unfreeze_top_layers(model, n_layers: int = 3):
    """Phase 2: unfreeze last N blocks for fine-tuning."""
    all_params = list(model.named_parameters())
    for name, param in all_params[-n_layers * 10:]:
        param.requires_grad = True


# ── Training loop ─────────────────────────────────────────────────────────────
def train_epoch(model, loader, optimizer, criterion, device):
    import torch
    model.train()
    total_loss, correct, total = 0, 0, 0
    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        out  = model(imgs)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * imgs.size(0)
        correct    += (out.argmax(1) == labels).sum().item()
        total      += imgs.size(0)
    return total_loss / total, correct / total


def eval_epoch(model, loader, criterion, device):
    import torch
    model.eval()
    total_loss, correct, total = 0, 0, 0
    all_preds, all_labels = [], []
    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            out  = model(imgs)
            loss = criterion(out, labels)
            total_loss += loss.item() * imgs.size(0)
            correct    += (out.argmax(1) == labels).sum().item()
            total      += imgs.size(0)
            all_preds.extend(out.argmax(1).cpu().tolist())
            all_labels.extend(labels.cpu().tolist())
    from sklearn.metrics import f1_score
    macro_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    return total_loss / total, correct / total, macro_f1


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader

    parser = argparse.ArgumentParser()
    parser.add_argument("--crop",      default="tomato")
    parser.add_argument("--model",     default="efficientnet_b0",
                        choices=["efficientnet_b0", "efficientnet_b2", "mobilenet_v3", "convnext_tiny"])
    parser.add_argument("--epochs",    type=int,   default=20)
    parser.add_argument("--batch",     type=int,   default=32)
    parser.add_argument("--lr",        type=float, default=1e-3)
    parser.add_argument("--lr-finetune", type=float, default=1e-4)
    parser.add_argument("--image-size", type=int,  default=224)
    parser.add_argument("--workers",   type=int,   default=2)
    parser.add_argument("--seed",      type=int,   default=42)
    parser.add_argument("--phase2-epoch", type=int, default=10,
                        help="Epoch at which to unfreeze backbone (fine-tuning phase)")
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    random.seed(args.seed)

    device = (
        "mps"  if torch.backends.mps.is_available() else   # Mac M2
        "cuda" if torch.cuda.is_available()          else
        "cpu"
    )
    print(f"Device: {device}")

    # Load splits
    split_dir   = SPLITS_DIR / args.crop
    train_recs  = load_split(split_dir / "train.csv")
    val_recs    = load_split(split_dir / "val.csv")
    class_to_idx = build_class_index(train_recs)
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    num_classes  = len(class_to_idx)

    print(f"\nCrop: {args.crop}  Classes: {num_classes}")
    print(f"Train: {len(train_recs):,}  Val: {len(val_recs):,}")

    # Datasets
    train_ds = ZipImageDataset(train_recs, class_to_idx, transform=get_transforms(args.image_size, augment=True))
    val_ds   = ZipImageDataset(val_recs,   class_to_idx, transform=get_transforms(args.image_size, augment=False))

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True,  num_workers=args.workers, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=args.batch, shuffle=False, num_workers=args.workers, pin_memory=True)

    # Model
    model = build_model(args.model, num_classes).to(device)
    freeze_backbone(model, args.model)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)  # improves calibration
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    # Experiment tracking
    exp_name = f"exp_{args.model}_{args.crop}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    exp_dir  = REPORTS_DIR / exp_name
    exp_dir.mkdir(parents=True, exist_ok=True)
    out_model_dir = MODELS_DIR / args.crop
    out_model_dir.mkdir(parents=True, exist_ok=True)

    best_macro_f1  = 0.0
    best_ckpt_path = out_model_dir / f"{args.model}_best.pt"
    history        = []

    print(f"\nTraining experiment: {exp_name}")
    print("=" * 60)

    for epoch in range(1, args.epochs + 1):
        # Phase 2: unfreeze backbone at epoch phase2_epoch
        if epoch == args.phase2_epoch:
            print(f"\n[Epoch {epoch}] Entering Phase 2 — unfreezing backbone for fine-tuning")
            unfreeze_top_layers(model, n_layers=3)
            optimizer = torch.optim.AdamW(
                filter(lambda p: p.requires_grad, model.parameters()),
                lr=args.lr_finetune, weight_decay=1e-4,
            )
            scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=args.epochs - args.phase2_epoch + 1
            )

        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss,   val_acc, val_f1 = eval_epoch(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0

        row = {
            "epoch": epoch, "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4), "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4), "val_macro_f1": round(val_f1, 4),
        }
        history.append(row)

        flag = ""
        if val_f1 > best_macro_f1:
            best_macro_f1 = val_f1
            torch.save(model.state_dict(), best_ckpt_path)
            flag = "  ✓ saved"

        print(
            f"Epoch {epoch:3d}/{args.epochs} | "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.3f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.3f} macro_f1={val_f1:.4f} | "
            f"{elapsed:.1f}s{flag}"
        )

    # Save training history + config
    with open(exp_dir / "history.json", "w") as f:
        json.dump(history, f, indent=2)

    config = {
        "crop": args.crop, "model": args.model,
        "epochs": args.epochs, "batch": args.batch,
        "lr": args.lr, "lr_finetune": args.lr_finetune,
        "image_size": args.image_size, "seed": args.seed,
        "num_classes": num_classes,
        "best_val_macro_f1": round(best_macro_f1, 4),
        "class_to_idx": class_to_idx,
        "best_checkpoint": str(best_ckpt_path),
        "trained_at": datetime.now().isoformat(),
        "device": device,
    }
    with open(exp_dir / "config.json", "w") as f:
        json.dump(config, f, indent=2)

    print(f"\n✓ Best val macro-F1: {best_macro_f1:.4f}")
    print(f"  Checkpoint: {best_ckpt_path}")
    print(f"  Experiment: {exp_dir}")
    print(f"\nNext step: python ml/evaluation/evaluate_model.py --crop {args.crop} --model {args.model}")


if __name__ == "__main__":
    main()
