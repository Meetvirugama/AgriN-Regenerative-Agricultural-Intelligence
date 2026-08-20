# AgriMesh ML Training Pipeline

This directory contains the offline tools to train, evaluate, and calibrate the per-crop EfficientNet-B0 disease-classification models used at inference time by `ai-service/services/vision_inference.py`.

---

## Directory Structure

```
ml/
├── training/
│   └── train_baseline.py         # Main training script (two-phase transfer learning)
├── preprocessing/
│   ├── data_split.py             # Train/val/test split with stratification
│   ├── dataset_audit.py          # Integrity checks + duplicate detection
│   └── label_normalizer.py       # Normalise label names across datasets
├── evaluation/
│   └── evaluate_model.py         # Per-class metrics, confusion matrix, AUC
├── calibration/
│   └── temperature_scaling.py    # Temperature scaling post-hoc calibration
└── models/
    └── {crop}/                   # One directory per crop (wheat, rice, maize …)
        ├── classes.json          # Class index → label mapping
        ├── metadata.json         # Dataset stats (n_images, splits, accuracy)
        ├── model_config.json     # EfficientNet-B0 hyperparameters
        └── training_config.json  # Training schedule (LR, epochs, augmentation)
```

---

## Current Status

> **⚠️ No `.pth` weight files are present in this repository.**
>
> The training pipeline is fully implemented but trained model artifacts have not been committed (standard practice for large binary files). As a result, **`ai-service/services/vision_inference.py` always falls back to Gemini Vision** for disease diagnosis — PyTorch inference is never activated.
>
> This is documented in `issue.md §6.2` and `§20`.

---

## Training a Model

### Prerequisites

```bash
pip install torch torchvision efficientnet-pytorch albumentations pillow scikit-learn pandas
```

Cloud GPU is recommended. The companion Colab notebook at `AgriMesh_Colab_Training.ipynb` (repo root) is the easiest starting point.

### Steps

1. **Prepare data** — place images in `data/raw/{crop}/{disease_class}/` folders
2. **Audit** — `python ml/preprocessing/dataset_audit.py --crop wheat`
3. **Normalise labels** — `python ml/preprocessing/label_normalizer.py --crop wheat`
4. **Split** — `python ml/preprocessing/data_split.py --crop wheat --val 0.15 --test 0.15`
5. **Train** — `python ml/training/train_baseline.py --crop wheat`
6. **Evaluate** — `python ml/evaluation/evaluate_model.py --crop wheat`
7. **Calibrate** — `python ml/calibration/temperature_scaling.py --crop wheat`

The training script writes a checkpoint to `ml/models/{crop}/{crop}_best.pth` and a JSON experiment report alongside it.

---

## Deploying a Trained Model

After training, the AI service needs to find the model at runtime:

1. Copy (or symlink) the `.pth` checkpoint:
   ```bash
   cp ml/models/wheat/wheat_best.pth ai-service/data/wheat_best.pth
   ```

2. Register the model in `ai-service/data/model_registry.json`:
   ```json
   {
     "wheat": {
       "model_path": "data/wheat_best.pth",
       "num_classes": 5,
       "classes": ["healthy", "rust", "powdery_mildew", "septoria", "fusarium"]
     }
   }
   ```

3. Restart the AI service. `vision_inference.py` will load the model on first request.

### Production Deployment (Recommended)

Store artifacts in object storage and download at deploy time:

```bash
# In your CI/CD pipeline or Dockerfile
aws s3 cp s3://your-bucket/agrimesh-models/ ai-service/data/ --recursive
```

---

## Supported Crops

| Crop | Classes JSON | Weights | Status |
|---|---|---|---|
| wheat | ✅ | ❌ | Needs training |
| rice | ✅ | ❌ | Needs training |
| maize | ✅ | ❌ | Needs training |
| cotton | ✅ | ❌ | Needs training |
| tomato | ✅ | ❌ | Needs training |

---

## Notes

- The `crop_registry.py` in `ai-service/models/` controls which crops pass through the PyTorch path (supported gate) vs. the Gemini Vision fallback (unsupported).
- After adding a new crop's `.pth` and registering it, also add it to `crop_registry.py`.
- The `temperature_scaling.py` calibration step is important for reliable confidence scores — do not skip it before production deployment.
