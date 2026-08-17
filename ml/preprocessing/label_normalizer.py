#!/usr/bin/env python3
"""
AgriMesh Label Normalizer — Section 5 (P0)
==========================================
Maps raw PlantVillage / PlantDoc folder names to canonical condition IDs
defined in data/taxonomy.json.

Reads:  reports/dataset_audit/dataset_inventory.csv
Writes: reports/dataset_audit/normalized_inventory.csv
        reports/dataset_audit/unmapped_labels.csv
        data/manifests/<crop>_manifest.csv  (one per crop)

Usage:
  python ml/preprocessing/label_normalizer.py [--crop tomato]

The --crop flag generates a single-crop manifest for training.
If omitted, all crops are processed.
"""

import csv
import json
import argparse
from pathlib import Path
from collections import defaultdict

ROOT          = Path(__file__).resolve().parents[2]
TAXONOMY_FILE = ROOT / "data" / "taxonomy.json"
INVENTORY_CSV = ROOT / "reports" / "dataset_audit" / "dataset_inventory.csv"
REPORTS_DIR   = ROOT / "reports" / "dataset_audit"
MANIFESTS_DIR = ROOT / "data" / "manifests"


def load_taxonomy() -> dict:
    if not TAXONOMY_FILE.exists():
        raise FileNotFoundError(f"taxonomy.json not found: {TAXONOMY_FILE}\nRun dataset_audit.py first.")
    with open(TAXONOMY_FILE) as f:
        return json.load(f)


def load_inventory() -> list[dict]:
    if not INVENTORY_CSV.exists():
        raise FileNotFoundError(f"dataset_inventory.csv not found: {INVENTORY_CSV}\nRun dataset_audit.py first.")
    with open(INVENTORY_CSV, newline="") as f:
        return list(csv.DictReader(f))


def normalize(records: list[dict], label_map: dict, taxonomy: dict) -> tuple[list, list]:
    """
    Normalize each record.
    Returns (normalized_records, unmapped_records).
    """
    normalized = []
    unmapped   = []

    crops_meta = taxonomy.get("crops", {})

    for r in records:
        raw_folder   = r["condition_folder"]
        canonical_id = label_map.get(raw_folder)

        if not canonical_id:
            unmapped.append(r)
            r["canonical_id"] = "UNMAPPED"
            r["condition_type"] = "unknown"
            r["crop"] = "unknown"
            r["supported"] = "false"
        else:
            crop_key = canonical_id.split(".")[0] if "." in canonical_id else "unknown"
            crop_meta = crops_meta.get(crop_key, {})
            conditions = crop_meta.get("conditions", {})
            cond_meta  = conditions.get(canonical_id, {})

            r["canonical_id"]    = canonical_id
            r["condition_type"]  = cond_meta.get("type", "unknown")
            r["crop"]            = crop_key
            r["supported"]       = str(crop_meta.get("supported", False)).lower()
            r["severity_default"]= cond_meta.get("severity_default", "unknown")

            normalized.append(r)

    return normalized, unmapped


def write_normalized_inventory(records: list[dict], unmapped: list[dict]):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    fields = [
        "source", "zip", "internal_path", "condition_folder",
        "canonical_id", "crop", "condition_type", "split",
        "supported", "severity_default", "size_bytes",
    ]

    out_path = REPORTS_DIR / "normalized_inventory.csv"
    with open(out_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(records)
    print(f"  Normalized inventory: {len(records):,} rows → {out_path.name}")

    # Unmapped report
    unmap_path = REPORTS_DIR / "unmapped_labels.csv"
    with open(unmap_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["source", "condition_folder", "internal_path", "size_bytes"], extrasaction="ignore")
        w.writeheader()
        w.writerows(unmapped)
    print(f"  Unmapped labels: {len(unmapped):,} rows → {unmap_path.name}")

    if unmapped:
        unique_folders = sorted(set(r["condition_folder"] for r in unmapped))
        print(f"\n  ⚠ {len(unique_folders)} unmapped label folders (add to taxonomy.json):")
        for f in unique_folders[:20]:
            print(f"    - {f}")
        if len(unique_folders) > 20:
            print(f"    ... and {len(unique_folders) - 20} more (see unmapped_labels.csv)")


def write_crop_manifests(records: list[dict], crop_filter: str = None):
    """
    Write per-crop manifest CSVs to data/manifests/.
    These are the lightweight metadata files used by the training pipeline.
    They do NOT contain image bytes — only paths inside the ZIP.
    """
    MANIFESTS_DIR.mkdir(parents=True, exist_ok=True)

    crops_seen = defaultdict(list)
    for r in records:
        if r.get("supported") == "true":
            crops_seen[r["crop"]].append(r)

    if crop_filter:
        crops_seen = {k: v for k, v in crops_seen.items() if k == crop_filter}

    for crop, crop_records in crops_seen.items():
        out_path = MANIFESTS_DIR / f"{crop}_manifest.csv"
        fields = [
            "source", "zip", "internal_path",
            "canonical_id", "condition_type", "split",
            "severity_default", "size_bytes",
        ]
        with open(out_path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            w.writeheader()
            w.writerows(crop_records)

        # Summary
        by_class = defaultdict(int)
        by_split = defaultdict(int)
        for r in crop_records:
            by_class[r["canonical_id"]] += 1
            by_split[r["split"]] += 1

        print(f"\n  Crop: {crop} — {len(crop_records):,} images → {out_path.name}")
        print(f"    Splits: { dict(by_split) }")
        print(f"    Classes:")
        for cid, cnt in sorted(by_class.items()):
            print(f"      {cid:<50} {cnt:>5,}")


def main():
    parser = argparse.ArgumentParser(description="AgriMesh Label Normalizer")
    parser.add_argument("--crop", type=str, default=None,
                        help="Only generate manifest for this crop (e.g. --crop tomato)")
    args = parser.parse_args()

    print("=" * 60)
    print("AgriMesh Label Normalizer — Section 5 (P0)")
    print("=" * 60)

    taxonomy  = load_taxonomy()
    label_map = taxonomy.get("label_map", {})
    print(f"Loaded taxonomy: {len(label_map)} label mappings\n")

    records = load_inventory()
    print(f"Loaded inventory: {len(records):,} records\n")

    normalized, unmapped = normalize(records, label_map, taxonomy)

    print(f"Results:")
    print(f"  Normalized: {len(normalized):,}")
    print(f"  Unmapped:   {len(unmapped):,}\n")

    write_normalized_inventory(normalized, unmapped)
    write_crop_manifests(normalized, crop_filter=args.crop)

    print(f"\n✓ Done. Next step: run data_split.py --crop tomato")


if __name__ == "__main__":
    main()
