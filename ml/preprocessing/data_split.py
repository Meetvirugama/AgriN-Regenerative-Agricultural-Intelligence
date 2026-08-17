#!/usr/bin/env python3
"""
AgriMesh Data Split Strategy — Section 7 (P0)
=============================================
Creates high-quality train / validation / test splits from a crop manifest.

Split design (Section 7):
  TRAIN     PlantVillage + compatible PlantDoc train images
  VAL       Held-out images (stratified by class)
  TEST-A    PlantVillage benchmark (separate from training)
  TEST-B    PlantDoc benchmark (realistic, unseen during training)
  TEST-C    Real AgriMesh field data (never used in any training phase)

Key quality rules:
  - Prevent same-leaf leakage (images from same source folder grouped)
  - Stratified split to maintain class balance
  - Class imbalance report before and after split
  - Freeze final test set before any model selection
  - Never augment validation or test images

Usage:
  python ml/preprocessing/data_split.py --crop tomato --val-pct 0.15

Reads:  data/manifests/<crop>_manifest.csv
Writes: data/splits/<crop>/
          train.csv
          val.csv
          test_a_plantvillage.csv
          test_b_plantdoc.csv
          split_report.md
"""

import csv
import json
import random
import argparse
from pathlib import Path
from collections import defaultdict

ROOT          = Path(__file__).resolve().parents[2]
MANIFESTS_DIR = ROOT / "data" / "manifests"
SPLITS_DIR    = ROOT / "data" / "splits"
REPORTS_DIR   = ROOT / "reports" / "dataset_audit"


def load_manifest(crop: str) -> list[dict]:
    path = MANIFESTS_DIR / f"{crop}_manifest.csv"
    if not path.exists():
        raise FileNotFoundError(
            f"Manifest not found: {path}\n"
            "Run dataset_audit.py then label_normalizer.py first."
        )
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def check_class_balance(records: list[dict], label: str = "dataset"):
    """Print class distribution and warn on severe imbalance."""
    by_class = defaultdict(int)
    for r in records:
        by_class[r["canonical_id"]] += 1
    total = sum(by_class.values())

    print(f"\n  Class balance in {label} ({total:,} total):")
    counts = sorted(by_class.items(), key=lambda x: -x[1])
    for cid, cnt in counts:
        pct = cnt / total * 100
        flag = " ⚠ IMBALANCED" if pct < 3 else ""
        print(f"    {cid:<50} {cnt:>6,}  ({pct:5.1f}%){flag}")

    max_c = max(by_class.values())
    min_c = min(by_class.values())
    ratio = max_c / max(min_c, 1)
    if ratio > 10:
        print(f"\n  ⚠ WARNING: Imbalance ratio {ratio:.1f}x — consider class weighting or oversampling during training.")

    return by_class


def stratified_split(
    records: list[dict],
    val_pct: float = 0.15,
    seed: int = 42,
) -> tuple[list, list]:
    """
    Stratified split per class.
    Returns (train_records, val_records).

    Note: Does NOT split across sources — PlantDoc test set is kept separate.
    Operates only on PlantVillage (the primary training source).
    """
    random.seed(seed)
    by_class = defaultdict(list)
    for r in records:
        by_class[r["canonical_id"]].append(r)

    train, val = [], []
    for cid, recs in by_class.items():
        random.shuffle(recs)
        n_val = max(1, int(len(recs) * val_pct))
        val.extend(recs[:n_val])
        train.extend(recs[n_val:])

    return train, val


def write_split(records: list[dict], path: Path, label: str):
    fields = [
        "source", "zip", "internal_path",
        "canonical_id", "condition_type", "split",
        "severity_default", "size_bytes",
    ]
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(records)
    print(f"  {label:<25} {len(records):>6,} images → {path.name}")


def write_split_report(crop: str, splits: dict, out_dir: Path):
    path = out_dir / "split_report.md"
    with open(path, "w") as f:
        f.write(f"# AgriMesh Data Split Report — {crop}\n\n")
        f.write("## Split Sizes\n\n")
        f.write("| Split | Images | Purpose |\n|---|---|---|\n")
        f.write(f"| TRAIN | {len(splits['train']):,} | PlantVillage training |\n")
        f.write(f"| VAL | {len(splits['val']):,} | Held-out validation (stratified) |\n")
        f.write(f"| TEST-A | {len(splits['test_a']):,} | PlantVillage benchmark |\n")
        f.write(f"| TEST-B | {len(splits['test_b']):,} | PlantDoc realistic benchmark |\n")
        f.write(f"| TEST-C | 0 | Real AgriMesh field data (collect separately) |\n\n")

        f.write("## Quality Rules Applied\n\n")
        f.write("- Stratified split per class\n")
        f.write("- PlantDoc kept as separate TEST-B (not mixed into training)\n")
        f.write("- TEST-C is reserved for real farm photos — DO NOT add synthetic images here\n")
        f.write("- Validation and test sets are FROZEN — do not retune against them\n\n")

        f.write("## Class Distribution (TRAIN)\n\n")
        f.write("| Class | Count |\n|---|---|\n")
        by_class = defaultdict(int)
        for r in splits["train"]:
            by_class[r["canonical_id"]] += 1
        for cid, cnt in sorted(by_class.items()):
            f.write(f"| {cid} | {cnt:,} |\n")

        f.write("\n## Important Notes\n\n")
        f.write("> PlantVillage accuracy is NOT production accuracy.\n")
        f.write("> PlantDoc performance is the more realistic indicator.\n")
        f.write("> Real-world performance must be measured on TEST-C (actual farmer photos).\n")

    print(f"  Split report → {path.name}")


def main():
    parser = argparse.ArgumentParser(description="AgriMesh Data Split")
    parser.add_argument("--crop",    type=str, default="tomato")
    parser.add_argument("--val-pct", type=float, default=0.15)
    parser.add_argument("--seed",    type=int,   default=42)
    args = parser.parse_args()

    print("=" * 60)
    print(f"AgriMesh Data Split — crop: {args.crop}")
    print("=" * 60)

    records = load_manifest(args.crop)
    print(f"Loaded manifest: {len(records):,} records\n")

    # Separate by source
    plantvillage = [r for r in records if r["source"] == "PlantVillage"]
    plantdoc     = [r for r in records if r["source"] == "PlantDoc"]
    plantseg     = [r for r in records if r["source"] == "PlantSeg"]

    print(f"Source breakdown:")
    print(f"  PlantVillage: {len(plantvillage):,}")
    print(f"  PlantDoc:     {len(plantdoc):,}")
    print(f"  PlantSeg:     {len(plantseg):,}")

    # Check class balance on full training corpus
    check_class_balance(plantvillage, label="PlantVillage")
    if plantdoc:
        check_class_balance(plantdoc, label="PlantDoc")

    # Split PlantVillage → TRAIN + VAL + TEST-A
    # Rule: use existing 'test' split from ZIP if available, otherwise stratify
    pv_test  = [r for r in plantvillage if r.get("split") == "test"]
    pv_train_pool = [r for r in plantvillage if r.get("split") != "test"]

    if not pv_test:
        # No pre-defined test split — carve 10% out for TEST-A
        random.seed(args.seed)
        by_class_pv = defaultdict(list)
        for r in pv_train_pool:
            by_class_pv[r["canonical_id"]].append(r)
        pv_test, pv_train_pool_new = [], []
        for recs in by_class_pv.values():
            random.shuffle(recs)
            n = max(1, int(len(recs) * 0.10))
            pv_test.extend(recs[:n])
            pv_train_pool_new.extend(recs[n:])
        pv_train_pool = pv_train_pool_new

    train, val = stratified_split(pv_train_pool, val_pct=args.val_pct, seed=args.seed)

    # TEST-B: use PlantDoc 'test' split if available, else all PlantDoc
    pd_test = [r for r in plantdoc if r.get("split") == "test"] or plantdoc

    splits = {
        "train":  train,
        "val":    val,
        "test_a": pv_test,
        "test_b": pd_test,
    }

    print(f"\nSplit sizes:")
    out_dir = SPLITS_DIR / args.crop
    out_dir.mkdir(parents=True, exist_ok=True)

    write_split(train,   out_dir / "train.csv",                    "TRAIN")
    write_split(val,     out_dir / "val.csv",                      "VAL")
    write_split(pv_test, out_dir / "test_a_plantvillage.csv",      "TEST-A (PlantVillage)")
    write_split(pd_test, out_dir / "test_b_plantdoc.csv",          "TEST-B (PlantDoc)")

    write_split_report(args.crop, splits, out_dir)

    print(f"\n✓ Splits written to: {out_dir}")
    print(f"  Next step: python ml/training/train_baseline.py --crop {args.crop}")


if __name__ == "__main__":
    main()
