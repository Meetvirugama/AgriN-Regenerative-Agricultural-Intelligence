"""
CropVisionPredictor — Crop-Agnostic Multi-Model EfficientNet-B0 Loader
=======================================================================

Architecture (Section 47.1 — Training vs Inference):
  - On demand: loads {crop}_model.pth + classes.json from ml/models/{crop}/
  - Models are lazy-loaded per crop on first request (not all at startup)
  - Falls back to Gemini Vision when no local model exists for a crop

Registry source of truth: data/model_registry.json
  → active_models with type "pytorch-classification" get a real .pth
  → crops with type "LLM-vision-fusion" (e.g. tomato) use Gemini fallback
"""

import torch
import torchvision.models as tv_models
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import json
import io
from pathlib import Path
from typing import Optional

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "ml" / "models"
MODEL_REGISTRY_FILE = ROOT / "data" / "model_registry.json"


def _load_registry() -> dict:
    if MODEL_REGISTRY_FILE.exists():
        with open(MODEL_REGISTRY_FILE) as f:
            return json.load(f)
    return {"active_models": {}}


def _load_classes(crop: str) -> list[str]:
    """Load ordered class list from ml/models/{crop}/classes.json."""
    classes_file = MODELS_DIR / crop / "classes.json"
    if not classes_file.exists():
        raise FileNotFoundError(f"classes.json not found for crop '{crop}': {classes_file}")
    with open(classes_file) as f:
        data = json.load(f)
    # classes.json is a dict {"0": "label", "1": "label", ...}
    return [data[str(i)] for i in range(len(data))]


def _build_transforms(image_size: int, mean: list, std: list) -> transforms.Compose:
    return transforms.Compose([
        transforms.Resize(image_size + 32),        # slight oversize for center crop
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
    ])


def _load_efficientnet_b0(weights_path: Path, num_classes: int, device: torch.device) -> nn.Module:
    """
    Load an EfficientNet-B0 model from a .pth file.

    The .pth was saved with torch.save(model, path) (full model, not state_dict).
    We try full-model load first; if that fails (e.g. class mismatch), we build
    a fresh EfficientNet-B0 with matching classifier head and load state_dict.
    """
    # Try full model load
    try:
        model = torch.load(weights_path, map_location=device, weights_only=False)
        if isinstance(model, dict):
            raise TypeError("Loaded object is a dict (likely state_dict), not a full model.")
        model.eval()
        model = model.to(device)
        print(f"[Vision] Loaded full model from {weights_path}")
        return model
    except Exception as full_err:
        print(f"[Vision] Full model load failed, trying state_dict... ({type(full_err).__name__})")

    # Fall back to rebuilding with matching head
    try:
        model = tv_models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
        state = torch.load(weights_path, map_location=device, weights_only=True)
        # state may be full state_dict or wrapped {"model_state_dict": ...}
        if "model_state_dict" in state:
            state = state["model_state_dict"]
        model.load_state_dict(state)
        model.eval()
        model = model.to(device)
        print(f"[Vision] Loaded state_dict from {weights_path} (num_classes={num_classes})")
        return model
    except Exception as sd_err:
        raise RuntimeError(
            f"[Vision] Could not load model for {weights_path}: sd_err={sd_err}"
        )


class CropVisionPredictor:
    """
    Lazy-loading, crop-agnostic PyTorch inference engine.

    Usage:
        result = crop_vision_predictor.predict(image_bytes, crop_type="corn")
        # → {"condition": "Corn_(maize)___Common_rust_", "confidence": 0.97, "top_k": [...]}
    """

    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() 
            else "mps" if torch.backends.mps.is_available() 
            else "cpu"
        )
        self._registry = _load_registry()
        # Lazy cache: crop_key → {"model": nn.Module, "classes": list, "transform": Compose}
        self._models: dict[str, dict] = {}
        print(f"[Vision] CropVisionPredictor initialised on device={self.device}")
        print(f"[Vision] Active pytorch models: {self._pytorch_crops()}")

    def _pytorch_crops(self) -> list[str]:
        """List crops that have a real .pth model registered."""
        return [
            crop for crop, info in self._registry.get("active_models", {}).items()
            if info.get("type") == "pytorch-classification"
        ]

    def _get_model(self, crop: str) -> Optional[dict]:
        """Return cached model bundle for crop, loading on first call."""
        if crop in self._models:
            return self._models[crop]

        info = self._registry.get("active_models", {}).get(crop)
        if not info or info.get("type") != "pytorch-classification":
            return None  # Gemini fallback crop

        weights_path = ROOT / info["weights_path"]
        if not weights_path.exists():
            print(f"[Vision] WARNING: weights not found at {weights_path}")
            return None

        try:
            classes = _load_classes(crop)
            num_classes = len(classes)
            mean = info.get("normalization_mean", [0.485, 0.456, 0.406])
            std = info.get("normalization_std", [0.229, 0.224, 0.225])
            image_size = info.get("image_size", 224)

            model = _load_efficientnet_b0(weights_path, num_classes, self.device)
            transform = _build_transforms(image_size, mean, std)

            bundle = {"model": model, "classes": classes, "transform": transform}
            self._models[crop] = bundle
            print(f"[Vision] Loaded and cached model for crop='{crop}' ({num_classes} classes)")
            return bundle

        except Exception as e:
            print(f"[Vision] Failed to load model for '{crop}': {e}")
            return None

    def predict(self, image_bytes: bytes, crop_type: str = "unknown") -> dict:
        """
        Run inference for the given crop.

        Returns:
            {
              "condition": str,       # raw class label from classes.json
              "confidence": float,    # softmax probability of top class
              "top_k": [{"condition": str, "probability": float}, ...]
            }

        If no local model → delegates to Gemini Vision fallback.
        """
        crop_key = crop_type.lower().split()[0]
        bundle = self._get_model(crop_key)

        if bundle is None:
            print(f"[Vision] No local model for '{crop_key}'. Using Gemini Vision fallback.")
            return self._fallback_gemini_vision(image_bytes, crop_type)

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            input_tensor = bundle["transform"](image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = bundle["model"](input_tensor)
                probs = torch.nn.functional.softmax(logits, dim=1)[0]

            classes = bundle["classes"]
            top_probs, top_indices = torch.topk(probs, min(3, len(classes)))

            primary_idx = top_indices[0].item()
            primary_conf = top_probs[0].item()

            top_k = [
                {"condition": classes[i.item()], "probability": p.item()}
                for p, i in zip(top_probs, top_indices)
            ]

            return {
                "condition": classes[primary_idx],
                "confidence": primary_conf,
                "top_k": top_k,
            }

        except Exception as e:
            print(f"[Vision] Inference error for '{crop_key}': {e}")
            raise

    def _fallback_gemini_vision(self, image_bytes: bytes, crop_type: str) -> dict:
        """Use Gemini Vision as fallback when no local model exists."""
        from services.gemini_client import analyze_image_with_prompt
        from models.schemas import KNOWN_CONDITIONS
        from pydantic import BaseModel
        from typing import List

        class TopK(BaseModel):
            condition: str
            probability: float

        class VisionFallback(BaseModel):
            condition: str
            confidence: float
            top_k: List[TopK]

        crop_key = crop_type.lower().split()[0]
        known_classes = KNOWN_CONDITIONS.get(crop_key, KNOWN_CONDITIONS["default"])
        classes_str = ", ".join(known_classes)

        prompt = (
            f"You are the Vision Backbone for an agricultural AI.\n"
            f"Your ONLY job is to identify the primary crop condition from this image.\n"
            f"Do not reason about weather or context. Just look at the visual symptoms.\n\n"
            f"Valid classes for this crop: {classes_str}.\n"
            f"If you are unsure, output 'Unknown' and a low confidence score.\n\n"
            f"Return the primary condition, a confidence score (0.0 to 1.0), "
            f"and the top 3 differential conditions with their probabilities."
        )

        try:
            result = analyze_image_with_prompt(image_bytes, "image/jpeg", prompt, VisionFallback)
            return {
                "condition": result.get("condition"),
                "confidence": result.get("confidence", 0.0),
                "top_k": [{"condition": k.get("condition"), "probability": k.get("probability")} for k in result.get("top_k", [])],
            }
        except Exception as e:
            print(f"[Vision] Gemini fallback failed: {e}")
            raise Exception(f"Gemini fallback failed: {e}")

    def list_supported_crops(self) -> list[str]:
        """Return all crops with an active local .pth model."""
        return self._pytorch_crops()

    def model_info(self) -> list[dict]:
        """Return summary info for all registered active models."""
        result = []
        for crop, info in self._registry.get("active_models", {}).items():
            result.append({
                "crop": crop,
                "backbone": info.get("backbone"),
                "type": info.get("type"),
                "num_classes": info.get("num_classes"),
                "test_accuracy": info.get("test_accuracy"),
                "test_macro_f1": info.get("test_macro_f1"),
                "status": info.get("status"),
                "loaded": crop in self._models,
            })
        return result


# Module-level singleton
crop_vision_predictor = CropVisionPredictor()

# Backward-compat alias (diagnosis_service.py imports vision_predictor)
vision_predictor = crop_vision_predictor
