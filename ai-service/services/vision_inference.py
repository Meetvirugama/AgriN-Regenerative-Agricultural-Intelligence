import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import json
import io
import os
from models.schemas import KNOWN_CONDITIONS

# Constants
MODEL_PATH = "models/tomato-v1/model.pt"
CALIBRATION_PATH = "models/tomato-v1/calibration.json"
NUM_CLASSES = len(KNOWN_CONDITIONS.get("tomato", []))

class VisionModelPredictor:
    def __init__(self):
        self.device = torch.device("cpu") # Mac M2 will use cpu/mps if available, cpu is safe
        self.model = None
        self.classes = KNOWN_CONDITIONS.get("tomato", [])
        self.temperature = 1.0
        
        # Standard ImageNet transforms used by MobileNet/EfficientNet
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        self._load_model()

    def _load_model(self):
        """Loads the trained PyTorch model and calibration parameters."""
        if not os.path.exists(MODEL_PATH):
            print(f"[Vision] Warning: Model file {MODEL_PATH} not found. Operating in fallback mode.")
            return

        try:
            # We assume a simple MobileNetV3 or EfficientNet structure saved via torch.save
            self.model = torch.load(MODEL_PATH, map_location=self.device)
            self.model.eval()
            print(f"[Vision] Successfully loaded model from {MODEL_PATH}")
            
            if os.path.exists(CALIBRATION_PATH):
                with open(CALIBRATION_PATH, 'r') as f:
                    calib_data = json.load(f)
                    self.temperature = calib_data.get("temperature", 1.0)
                    print(f"[Vision] Loaded calibration temperature: {self.temperature}")
        except Exception as e:
            print(f"[Vision] Failed to load model: {e}")
            self.model = None

    def predict(self, image_bytes: bytes, crop_type: str = "tomato"):
        """
        Runs inference on an image.
        Returns condition, confidence, and top-k probabilities.
        If local model is not trained yet, uses Gemini as a fallback vision backbone.
        """
        if self.model is None:
            print("[Vision] Local model not loaded. Falling back to Gemini Vision Backbone...")
            return self._fallback_gemini_vision(image_bytes, crop_type)

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                logits = self.model(input_tensor)
                
                # Apply temperature scaling
                scaled_logits = logits / self.temperature
                
                # Get probabilities
                probs = torch.nn.functional.softmax(scaled_logits, dim=1)[0]
                
                # Get top prediction
                max_prob, max_idx = torch.max(probs, dim=0)
                condition = self.classes[max_idx.item()]
                confidence = max_prob.item()

                # Get top-3
                top3_probs, top3_indices = torch.topk(probs, 3)
                top_k = []
                for p, i in zip(top3_probs, top3_indices):
                    top_k.append({
                        "condition": self.classes[i.item()],
                        "probability": p.item()
                    })

                return {
                    "condition": condition,
                    "confidence": confidence,
                    "top_k": top_k
                }
        except Exception as e:
            print(f"[Vision] Inference error: {e}")
            raise

    def _fallback_gemini_vision(self, image_bytes: bytes, crop_type: str):
        from services.gemini_client import analyze_image_with_prompt
        from pydantic import BaseModel, Field
        from typing import List
        
        class TopK(BaseModel):
            condition: str
            probability: float
            
        class VisionFallback(BaseModel):
            condition: str
            confidence: float
            top_k: List[TopK]

        known_classes = KNOWN_CONDITIONS.get(crop_type.lower().split()[0], KNOWN_CONDITIONS["default"])
        classes_str = ", ".join(known_classes)

        prompt = f"""You are the Vision Backbone for an agricultural AI.
Your ONLY job is to identify the primary crop condition from this image.
Do not reason about weather or context. Just look at the visual symptoms.

Valid classes for this crop: {classes_str}.
If you are unsure, you must output 'Unknown' and a low confidence score.

Return the primary condition, a confidence score (0.0 to 1.0), and the top 3 differential conditions with their probabilities."""
        
        try:
            result = analyze_image_with_prompt(image_bytes, "image/jpeg", prompt, VisionFallback)
            # Ensure it matches the expected dict structure
            return {
                "condition": result.condition,
                "confidence": result.confidence,
                "top_k": [{"condition": k.condition, "probability": k.probability} for k in result.top_k]
            }
        except Exception as e:
            print(f"[Vision] Gemini fallback failed: {e}")
            return {"condition": "Unknown", "confidence": 0.0, "top_k": []}

# Singleton instance
vision_predictor = VisionModelPredictor()
