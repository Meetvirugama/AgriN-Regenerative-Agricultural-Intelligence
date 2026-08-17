"""
CropModelRegistry — Section 0.2 (Crop-agnostic architecture)
=============================================================
Single source of truth for what crops + models are available.

Rules (Section 47.1 — Training vs Inference):
  - Inference loads only: weights + classes.json + preprocessing.json + calibration.json
  - Raw training datasets (PlantVillage/PlantDoc/PlantSeg) are NOT loaded per-request
  - Each crop has its own model entry with its own class list

Usage:
  from models.crop_registry import CropModelRegistry

  registry = CropModelRegistry()
  info = registry.get(crop="tomato")
  classes = registry.get_classes(crop="tomato")
  is_supported = registry.is_supported(crop="wheat")  # False
"""

import json
import os
from pathlib import Path
from typing import Optional

# Root of project
ROOT = Path(__file__).resolve().parents[2]
MODEL_REGISTRY_FILE = ROOT / "data" / "model_registry.json"
MODELS_DIR = ROOT / "data" / "models"
TAXONOMY_FILE = ROOT / "data" / "taxonomy.json"


class CropModelRegistry:
    """
    Crop-agnostic model registry.

    Loads model_registry.json and per-crop artifacts (classes.json, preprocessing.json).
    Provides a unified interface regardless of which crop is being diagnosed.

    Supported crops follow the quality gate from Section 0.2:
      dataset quality → label quality → model validation → calibration → production enabled
    """

    def __init__(self):
        self._registry = self._load_registry()
        self._taxonomy = self._load_taxonomy()
        self._classes_cache: dict[str, list] = {}

    def _load_registry(self) -> dict:
        if MODEL_REGISTRY_FILE.exists():
            with open(MODEL_REGISTRY_FILE) as f:
                return json.load(f)
        return {"active_models": {}, "pending_models": {}}

    def _load_taxonomy(self) -> dict:
        if TAXONOMY_FILE.exists():
            with open(TAXONOMY_FILE) as f:
                return json.load(f)
        return {}

    def is_supported(self, crop: str) -> bool:
        """
        A crop is production-supported only when it has an active_models entry.
        Pending / not-yet-validated crops return False.
        """
        return crop.lower() in self._registry.get("active_models", {})

    def get(self, crop: str) -> Optional[dict]:
        """Return the active model info for a crop, or None if unsupported."""
        return self._registry.get("active_models", {}).get(crop.lower())

    def get_classes(self, crop: str) -> list[str]:
        """
        Return the ordered class list for a crop (from classes.json artifact).
        Falls back to taxonomy.json if no artifact file found.
        """
        crop = crop.lower()
        if crop in self._classes_cache:
            return self._classes_cache[crop]

        # Try classes.json artifact (production inference artifact)
        classes_file = MODELS_DIR / crop / "classes.json"
        if classes_file.exists():
            with open(classes_file) as f:
                data = json.load(f)
            classes = data.get("classes", [])
            self._classes_cache[crop] = classes
            return classes

        # Fallback: derive from taxonomy.json
        crop_meta = self._taxonomy.get("crops", {}).get(crop, {})
        classes = list(crop_meta.get("conditions", {}).keys())
        self._classes_cache[crop] = classes
        return classes

    def get_preprocessing(self, crop: str) -> dict:
        """Return preprocessing config for a crop's model."""
        prep_file = MODELS_DIR / crop.lower() / "preprocessing.json"
        if prep_file.exists():
            with open(prep_file) as f:
                return json.load(f)
        # Safe defaults (ImageNet normalization, 224px)
        return {
            "image_size": [224, 224],
            "normalize_mean": [0.485, 0.456, 0.406],
            "normalize_std": [0.229, 0.224, 0.225],
            "interpolation": "bilinear",
        }

    def get_confidence_threshold(self, crop: str) -> float:
        """Return the minimum confidence to report a definitive diagnosis."""
        classes_file = MODELS_DIR / crop.lower() / "classes.json"
        if classes_file.exists():
            with open(classes_file) as f:
                data = json.load(f)
            return data.get("confidence_threshold_unknown", 0.55)
        return 0.55  # safe default

    def list_supported_crops(self) -> list[str]:
        return list(self._registry.get("active_models", {}).keys())

    def list_pending_crops(self) -> list[str]:
        return list(self._registry.get("pending_models", {}).keys())

    def get_unknown_class(self, crop: str) -> str:
        """Return the canonical ID for the unknown/unsupported condition of a crop."""
        return f"{crop.lower()}.unknown"


# Module-level singleton (import and reuse)
crop_registry = CropModelRegistry()
