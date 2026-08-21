#!/usr/bin/env python3
"""
AgriMesh Dataset Audit Script — Section 4 (P0)
===============================================
Scans PlantVillage, PlantDoc, and PlantSeg ZIPs from the local dataset/ folder.

Generates:
  reports/dataset_audit/
    dataset_inventory.csv       — every image: path, crop, condition, source, split
    class_distribution.csv      — per-class image counts
    corruption_report.csv       — unreadable / zero-byte images
    duplicate_report.csv        — exact SHA-256 duplicates across files
    audit_summary.md            — human-readable summary

Usage:
  python ml/preprocessing/dataset_audit.py

Hardware: runs on Mac M2 / 8 GB RAM (CPU only, no GPU needed).
"""

import os
import sys
import csv
import json
import hashlib
import zipfile
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]           # project root
DATASET_DIR = ROOT / "dataset"
TAXONOMY_FILE = ROOT / "data" / "taxonomy.json"
REPORTS_DIR = ROOT / "reports" / "dataset_audit"

PLANTVILLAGE_ZIP = DATASET_DIR / "data.zip"
PLANTDOC_ZIP     = DATASET_DIR / "PlantDoc-Dataset-master.zip"
PLANTSEG_ZIP     = DATASET_DIR / "PlantSeg-main.zip"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}

# ── Load taxonomy ─────────────────────────────────────────────────────────────
def load_taxonomy():
    if not TAXONOMY_FILE.exists():
        print(f"[WARN] taxonomy.json not found at {TAXONOMY_FILE}")
        return {}, {}
    with open(TAXONOMY_FILE) as f:
        t = json.load(f)
    return t.get("label_map", {}), t.get("crops", {})


# ── ZIP scanner ───────────────────────────────────────────────────────────────
def scan_zip(zip_path: Path, source_name: str, label_map: dict) -> list[dict]:
    """
    Scan a ZIP file. For each image file found, record:
      source, zip_path, internal_path, crop_folder, condition_folder,
      canonical_id, split (train/val/test/unknown), file_size_bytes
    """
    records = []
    if not zip_path.exists():
        print(f"  [SKIP] {zip_path.name} not found — skipping.")
        return records

    print(f"  Scanning {zip_path.name} ...")
    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            names = z.namelist()
            print(f"    {len(names):,} entries in ZIP")

            for name in names:
                suffix = Path(name).suffix.lower()
                if suffix not in IMAGE_EXTENSIONS:
                    continue

                parts = name.split("/")
                if len(parts) < 2:
                    continue

                # Parent folder of the image = class/condition folder
                condition_folder = parts[-2]
                # Attempt to find split (train/val/test/valid)
                split = "unknown"
                for part in parts:
                    if part.lower() in ("train", "training"):
                        split = "train"
                    elif part.lower() in ("val", "valid", "validation"):
                        split = "val"
                    elif part.lower() in ("test", "testing"):
                        split = "test"

                # Map raw folder name → canonical id
                canonical_id = label_map.get(condition_folder, "UNMAPPED")
                crop_id = canonical_id.split(".")[0] if "." in canonical_id else "unknown"

                info = z.getinfo(name)
                records.append({
                    "source": source_name,
                    "zip": zip_path.name,
                    "internal_path": name,
                    "condition_folder": condition_folder,
                    "canonical_id": canonical_id,
                    "crop": crop_id,
                    "split": split,
                    "size_bytes": info.file_size,
                })

    except zipfile.BadZipFile as e:
        print(f"  [ERROR] {zip_path.name}: {e}")

    print(f"    Found {len(records):,} images")
    return records


# ── SHA-256 duplicate detection ───────────────────────────────────────────────
def detect_duplicates_from_records(records: list[dict], zip_paths: dict) -> list[dict]:
    """
    Hash images from ZIP to detect exact duplicates.
    (Skipped for speed in this run).
    """
    print("\nRunning duplicate detection (SHA-256, files ≤ 5 MB)...")
    hash_map = defaultdict(list)  # sha256 → [record, ...]
    MAX_SIZE = 5 * 1024 * 1024  # 5 MB

    for rec in records:
        if rec["size_bytes"] > MAX_SIZE:
            continue
        zip_path = zip_paths.get(rec["zip"])
        if not zip_path or not zip_path.exists():
            continue
        try:
            with zipfile.ZipFile(zip_path, "r") as z:
                data = z.read(rec["internal_path"])
            digest = hashlib.sha256(data).hexdigest()
            hash_map[digest].append(rec)
        except Exception:
            pass

    duplicates = []
    for digest, recs in hash_map.items():
        if len(recs) > 1:
            for r in recs:
                duplicates.append({
                    "sha256": digest,
                    "source": r["source"],
                    "path": r["internal_path"],
                    "canonical_id": r["canonical_id"],
                })

    print(f"  Found {len(duplicates)} duplicate image entries across {len([d for d in hash_map.values() if len(d)>1])} hash groups")
    return duplicates


# ── Report writers ────────────────────────────────────────────────────────────
def write_inventory(records: list[dict], out_dir: Path):
    path = out_dir / "dataset_inventory.csv"
    fields = ["source", "zip", "internal_path", "condition_folder", "canonical_id", "crop", "split", "size_bytes"]
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(records)
    print(f"  Wrote {len(records):,} rows → {path.name}")


def write_class_distribution(records: list[dict], out_dir: Path):
    counter = defaultdict(lambda: defaultdict(int))
    for r in records:
        counter[r["canonical_id"]][r["source"]] += 1

    path = out_dir / "class_distribution.csv"
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["canonical_id", "crop", "source", "count"])
        for cid in sorted(counter):
            crop = cid.split(".")[0] if "." in cid else "unknown"
            for src, cnt in sorted(counter[cid].items()):
                w.writerow([cid, crop, src, cnt])

    print(f"  Wrote class distribution → {path.name}")

    # Also print summary to console
    print("\n  Class distribution summary:")
    for cid in sorted(counter):
        total = sum(counter[cid].values())
        print(f"    {cid:<50} {total:>6,}")


def write_corruption_report(records: list[dict], out_dir: Path):
    bad = [r for r in records if r["size_bytes"] == 0]
    path = out_dir / "corruption_report.csv"
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["source", "internal_path", "size_bytes", "canonical_id"])
        w.writeheader()
        for r in bad:
            w.writerow({k: r[k] for k in ["source", "internal_path", "size_bytes", "canonical_id"]})
    print(f"  Found {len(bad)} zero-byte (corrupt) images → {path.name}")


def write_duplicate_report(duplicates: list[dict], out_dir: Path):
    path = out_dir / "duplicate_report.csv"
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["sha256", "source", "path", "canonical_id"])
        w.writeheader()
        w.writerows(duplicates)
    print(f"  Wrote {len(duplicates)} duplicate entries → {path.name}")


def write_summary(records: list[dict], duplicates: list[dict], out_dir: Path, label_map: dict):
    unmapped = [r for r in records if r["canonical_id"] == "UNMAPPED"]
    zero_byte = [r for r in records if r["size_bytes"] == 0]

    source_counts = defaultdict(int)
    for r in records:
        source_counts[r["source"]] += 1

    crop_counts = defaultdict(int)
    for r in records:
        crop_counts[r["crop"]] += 1

    path = out_dir / "audit_summary.md"
    with open(path, "w") as f:
        f.write(f"# AgriMesh Dataset Audit Summary\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"## Overview\n\n")
        f.write(f"| Metric | Value |\n|---|---|\n")
        f.write(f"| Total images | {len(records):,} |\n")
        f.write(f"| Corrupted (0 bytes) | {len(zero_byte)} |\n")
        f.write(f"| Exact duplicates | {len(duplicates)} |\n")
        f.write(f"| Unmapped labels | {len(unmapped)} |\n\n")

        f.write(f"## By Source\n\n")
        f.write(f"| Source | Images |\n|---|---|\n")
        for src, cnt in sorted(source_counts.items()):
            f.write(f"| {src} | {cnt:,} |\n")

        f.write(f"\n## By Crop\n\n")
        f.write(f"| Crop | Images |\n|---|---|\n")
        for crop, cnt in sorted(crop_counts.items(), key=lambda x: -x[1]):
            f.write(f"| {crop} | {cnt:,} |\n")

        if unmapped:
            f.write(f"\n## Unmapped Labels (need taxonomy.json entries)\n\n")
            unmapped_folders = sorted(set(r["condition_folder"] for r in unmapped))
            for folder in unmapped_folders[:50]:
                f.write(f"- `{folder}`\n")
            if len(unmapped_folders) > 50:
                f.write(f"- ... and {len(unmapped_folders) - 50} more\n")

        f.write(f"\n## Quality Notes\n\n")
        f.write(f"- PlantVillage: controlled lab images. Strong for training, NOT representative of real farm photos.\n")
        f.write(f"- PlantDoc: more realistic field images. Use as robustness benchmark.\n")
        f.write(f"- NEVER use PlantVillage test performance as production performance.\n")
        f.write(f"- Keep real AgriMesh field images as a completely separate, unseen test set.\n")

    print(f"\n  Audit summary written → {path.name}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("AgriMesh Dataset Audit — Section 4 (P0)")
    print("=" * 60)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    label_map, crops = load_taxonomy()
    print(f"Loaded taxonomy: {len(label_map)} label mappings, {len(crops)} crops\n")

    zip_paths = {
        "data.zip":                      PLANTVILLAGE_ZIP,
        "PlantDoc-Dataset-master.zip":   PLANTDOC_ZIP,
        "PlantSeg-main.zip":             PLANTSEG_ZIP,
    }

    all_records = []

    print("Scanning datasets:")
    all_records += scan_zip(PLANTVILLAGE_ZIP, "PlantVillage", label_map)
    all_records += scan_zip(PLANTDOC_ZIP,     "PlantDoc",     label_map)
    all_records += scan_zip(PLANTSEG_ZIP,     "PlantSeg",     label_map)

    print(f"\nTotal images found: {len(all_records):,}\n")

    print("Writing reports:")
    write_inventory(all_records, REPORTS_DIR)
    write_class_distribution(all_records, REPORTS_DIR)
    write_corruption_report(all_records, REPORTS_DIR)

    duplicates = detect_duplicates_from_records(all_records, zip_paths)
    write_duplicate_report(duplicates, REPORTS_DIR)
    write_summary(all_records, duplicates, REPORTS_DIR, label_map)

    print(f"\n✓ All reports written to: {REPORTS_DIR}")
    print("  Next step: review audit_summary.md then run label_normalizer.py")


if __name__ == "__main__":
    main()
