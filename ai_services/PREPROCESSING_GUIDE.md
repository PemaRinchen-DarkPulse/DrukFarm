# Preprocessing Pipeline - Complete Guide

## Overview

The **Preprocessing Pipeline** provides standardized, consistent image preprocessing for plant disease classification at both training and inference time. It ensures uniform inputs, proper normalization, and high-quality data.

## 🎯 Key Features

✅ **Unified Pipeline** - Same transformations for training and inference  
✅ **224×224 Resolution** - Aspect-preserving resize + center crop  
✅ **RGB-Only** - Consistent 3-channel input  
✅ **Dataset Normalization** - Computed mean/std from your data  
✅ **Quality Filtering** - Flags blur, exposure issues, corruption  
✅ **Label Encoding** - Integer class IDs with bidirectional mapping  
✅ **PyTorch Integration** - Ready-to-use Dataset and DataLoader  
✅ **Metadata Tracking** - Complete preprocessing audit trail  

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ai_services
drukFarmVenv\Scripts\activate
pip install torch torchvision opencv-python pillow numpy pandas tqdm
```

### 2. Preprocess Your Dataset

```bash
python preprocessing_pipeline.py \
    --dataset-path merged_dataset/images/train \
    --output-path preprocessed/train \
    --metadata-csv merged_dataset/metadata/split_files_list.csv
```

### 3. Use in Training

```python
from preprocessing_pytorch import create_dataloaders

dataloaders = create_dataloaders(
    train_csv='preprocessed/train/metadata/preprocessing_metadata.csv',
    val_csv='preprocessed/val/metadata/preprocessing_metadata.csv',
    batch_size=32
)

# Train your model
for images, labels in dataloaders['train']:
    # images: (B, 3, 224, 224), normalized
    # labels: integer class IDs
    outputs = model(images)
    loss = criterion(outputs, labels)
    # ...
```

## 📖 Pipeline Components

### 1. Resolution Standardization

**Process:**
```
Original Image
    ↓
Aspect-Preserving Resize (longer side to 224+)
    ↓
Center Crop to 224×224
    ↓
Final Image (224, 224, 3)
```

**Why:**
- Preserves aspect ratio (no distortion)
- Centers subject (disease symptoms)
- Consistent model input size
- Minimal information loss

**Example:**
```python
# Input: 1024×768 image
# Step 1: Resize to 299×224 (maintain aspect)
# Step 2: Center crop to 224×224
# Output: 224×224 image
```

### 2. Color Handling

**Conversions:**
- Grayscale → RGB (duplicate to 3 channels)
- RGBA → RGB (drop alpha channel)
- Multispectral → RGB (take first 3 channels)
- RGB → RGB (no change)

**Why:**
- Model expects 3 channels
- RGB sufficient for disease detection
- Ensures consistency across datasets

### 3. Normalization

**Formula:**
```
normalized = (pixel / 255.0 - mean) / std
```

**Computed Statistics:**
- Mean: [R_mean, G_mean, B_mean]
- Std: [R_std, G_std, B_std]
- Calculated from training set

**Why:**
- Zero-centers data → better gradient flow
- Unit variance → stable training
- Dataset-specific → better than ImageNet stats
- Required for neural network convergence

**Example Values:**
```
Mean (R, G, B): [0.485, 0.456, 0.406]
Std  (R, G, B): [0.229, 0.224, 0.225]
```

### 4. Quality Filtering

**Metrics:**

| Metric | Threshold | Detection |
|--------|-----------|-----------|
| Blur (Laplacian variance) | < 100.0 | Blurry images |
| Brightness | < 10 or > 245 | Under/over-exposed |
| Contrast (std dev) | < 10.0 | Low contrast |
| Corruption | NaN/Inf values | Corrupted files |

**Modes:**
- **Flag Only** (default): Mark in metadata, keep image
- **Remove**: Exclude from dataset

**Why:**
- Prevents training on poor quality data
- Allows manual review before removal
- Improves model performance
- Maintains data standards

### 5. Label Encoding

**Process:**
```
Canonical Labels (sorted alphabetically)
    ↓
Assign Integer IDs (0, 1, 2, ...)
    ↓
Create Bidirectional Mapping
    ↓
Save to label_map.csv
```

**Why:**
- Neural networks need integer labels
- Loss functions require numeric IDs
- Maintains interpretability
- Reproducible ordering

## 📁 Output Structure

```
preprocessed/
├── preprocessing_config.json       # Configuration used
├── preprocessing_rationale.md      # Detailed explanations
│
├── metadata/
│   ├── dataset_mean_std.csv        # Normalization statistics
│   ├── label_map.csv               # Class → ID mapping
│   ├── low_quality_report.csv      # Flagged images
│   └── preprocessing_metadata.csv  # Complete metadata
│
└── images/  (optional)
    └── [class folders with preprocessed images]
```

## 📊 Output Files

### 1. preprocessing_config.json

Configuration used for preprocessing:

```json
{
  "target_size": [224, 224],
  "resize_method": "aspect_preserving",
  "color_mode": "RGB",
  "normalize": true,
  "blur_threshold": 100.0,
  "brightness_min": 10.0,
  "brightness_max": 245.0,
  "remove_low_quality": false,
  "encode_labels": true,
  "random_seed": 42
}
```

### 2. dataset_mean_std.csv

Normalization statistics:

| channel | mean | std |
|---------|------|-----|
| R | 0.485000 | 0.229000 |
| G | 0.456000 | 0.224000 |
| B | 0.406000 | 0.225000 |

### 3. label_map.csv

Class to ID mapping:

| class_name | class_id |
|------------|----------|
| early blight | 0 |
| healthy | 1 |
| late blight | 2 |
| ... | ... |

### 4. low_quality_report.csv

Flagged low-quality images:

| filename | is_blurry | is_too_dark | is_too_bright | blur_score | brightness |
|----------|-----------|-------------|---------------|------------|------------|
| img001.jpg | True | False | False | 85.3 | 128.5 |
| img002.jpg | False | True | False | 120.4 | 8.2 |

### 5. preprocessing_metadata.csv

Complete preprocessing metadata for all images:

| Columns | Description |
|---------|-------------|
| image_path | Original image path |
| canonical_class | Class label |
| label_id | Encoded class ID |
| original_width, original_height | Original dimensions |
| final_width, final_height | After preprocessing (224×224) |
| rgb_converted | Whether conversion was needed |
| blur_score | Quality metric |
| brightness, contrast | Exposure metrics |
| is_low_quality | Overall quality flag |

## 🎓 Usage Examples

### Example 1: Basic Preprocessing

```python
from preprocessing_pipeline import DatasetPreprocessor, PreprocessingConfig

# Create configuration
config = PreprocessingConfig(
    target_size=(224, 224),
    normalize=True,
    enable_quality_filter=True,
    remove_low_quality=False  # Flag only
)

# Create preprocessor
preprocessor = DatasetPreprocessor(
    dataset_path='merged_dataset/images/train',
    output_path='preprocessed/train',
    config=config
)

# Run preprocessing
metadata_df = preprocessor.run()
```

### Example 2: PyTorch Training

```python
from preprocessing_pytorch import create_dataloaders
import torch
import torch.nn as nn

# Create dataloaders
dataloaders = create_dataloaders(
    train_csv='preprocessed/train/metadata/preprocessing_metadata.csv',
    val_csv='preprocessed/val/metadata/preprocessing_metadata.csv',
    batch_size=32,
    num_workers=4
)

# Define model
model = YourModel(num_classes=10)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters())

# Training loop
for epoch in range(num_epochs):
    model.train()
    for images, labels in dataloaders['train']:
        images, labels = images.cuda(), labels.cuda()
        
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
```

### Example 3: Inference

```python
from preprocessing_pytorch import InferencePreprocessor
import torch

# Load preprocessor
preprocessor = InferencePreprocessor.from_metadata_dir(
    'preprocessed/train/metadata'
)

# Preprocess image
image = preprocessor.preprocess('path/to/new_image.jpg')
# Shape: (1, 3, 224, 224), normalized

# Predict
with torch.no_grad():
    output = model(image)
    predicted_id = output.argmax(dim=1).item()

# Decode label
label_map = pd.read_csv('preprocessed/train/metadata/label_map.csv')
id_to_class = dict(zip(label_map['class_id'], label_map['class_name']))
predicted_class = id_to_class[predicted_id]
```

### Example 4: Custom Configuration

```python
from preprocessing_pipeline import PreprocessingConfig, DatasetPreprocessor

# Advanced configuration
config = PreprocessingConfig(
    target_size=(224, 224),
    normalize=True,
    blur_threshold=150.0,  # Stricter blur detection
    brightness_min=20.0,
    brightness_max=235.0,
    enable_contrast_normalization=True,  # Enable CLAHE
    enable_denoising=True,  # Enable noise reduction
    remove_low_quality=True,  # Actually remove bad images
    random_seed=42
)

preprocessor = DatasetPreprocessor(
    dataset_path='dataset',
    output_path='preprocessed',
    config=config
)

metadata_df = preprocessor.run(save_images=True)
```

## 🔬 Training vs Inference Consistency

### Identical Steps (Both)

1. **Load Image** → PIL/OpenCV
2. **Convert to RGB** → 3 channels
3. **Resize** → Aspect-preserving
4. **Center Crop** → 224×224
5. **Normalize** → (x - mean) / std
6. **To Tensor** → (3, 224, 224)

### Training-Only Steps

**Data Augmentation** (applied BEFORE normalization):
- Random horizontal flip (50%)
- Random vertical flip (30%)
- Random rotation (±20°)
- Color jitter (brightness, contrast, saturation)
- Random affine (translation)

```python
# Training
image = load_and_preprocess(img_path)  # → normalized
if training:
    image = denormalize(image)  # Temp denormalize
    image = augment(image)      # Apply augmentation
    image = normalize(image)    # Re-normalize
```

### Why This Matters

**Problem:** Train-test distribution mismatch
```
Training: augmented + normalized
Inference: only normalized
→ Model sees different distributions!
```

**Solution:** Separate augmentation and normalization
```
Training: preprocess → denorm → augment → renorm
Inference: preprocess (same as training base)
→ Consistent distributions!
```

## ⚙️ Configuration Options

### PreprocessingConfig

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `target_size` | (224, 224) | Any (H, W) | Final image resolution |
| `resize_method` | `"aspect_preserving"` | `"aspect_preserving"`, `"direct"` | How to resize |
| `color_mode` | `"RGB"` | `"RGB"` | Color space (RGB only supported) |
| `normalize` | `True` | `True`, `False` | Apply normalization |
| `blur_threshold` | `100.0` | Float | Laplacian variance threshold |
| `brightness_min` | `10.0` | 0-255 | Minimum brightness |
| `brightness_max` | `245.0` | 0-255 | Maximum brightness |
| `remove_low_quality` | `False` | `True`, `False` | Remove or flag only |
| `enable_contrast_normalization` | `False` | `True`, `False` | Apply CLAHE |
| `enable_denoising` | `False` | `True`, `False` | Apply denoising |
| `enable_histogram_equalization` | `False` | `True`, `False` | Apply histogram eq |
| `encode_labels` | `True` | `True`, `False` | Create label IDs |
| `random_seed` | `42` | Any int | For reproducibility |

## 🐛 Troubleshooting

### Issue: "Module not found: torch"

```bash
pip install torch torchvision
```

### Issue: Normalization stats not found

Ensure you run preprocessing on training set first:
```bash
python preprocessing_pipeline.py --dataset-path train_data --output-path preprocessed/train
```

Then use those stats for val/test.

### Issue: Images look wrong after preprocessing

Check normalization - images are in [-N, +N] range after (x - mean) / std.  
For visualization, denormalize:
```python
denormalized = image * std + mean
```

### Issue: Out of memory during preprocessing

Reduce batch size or process in chunks:
```python
config.batch_size = 50  # Smaller batches
```

### Issue: Quality filtering too aggressive

Adjust thresholds:
```python
config.blur_threshold = 50.0  # Lower = less strict
config.brightness_min = 5.0
config.brightness_max = 250.0
```

## 📈 Performance

### Expected Runtime

| Dataset Size | Preprocessing Time | Normalization Stats |
|--------------|-------------------|---------------------|
| 10K images | 5-10 min | 2-3 min |
| 50K images | 20-40 min | 8-12 min |
| 100K images | 40-80 min | 15-25 min |

*Times vary by hardware and image sizes*

### Optimization Tips

1. **Use SSD** for faster I/O
2. **Increase num_workers** in DataLoader
3. **Pin memory** for GPU training
4. **Prefetch** data with `persistent_workers=True`

## 🔗 Integration

### With Dataset Merger

```bash
# 1. Merge datasets
python dataset_merger.py --datasets-root myDatasets

# 2. Preprocess each split
python preprocessing_pipeline.py \
    --dataset-path merged_dataset/images/train \
    --metadata-csv merged_dataset/metadata/split_files_list.csv \
    --output-path preprocessed/train

python preprocessing_pipeline.py \
    --dataset-path merged_dataset/images/val \
    --output-path preprocessed/val

python preprocessing_pipeline.py \
    --dataset-path merged_dataset/images/test \
    --output-path preprocessed/test
```

### With Training Pipeline

```python
from preprocessing_pytorch import create_dataloaders

dataloaders = create_dataloaders(
    train_csv='preprocessed/train/metadata/preprocessing_metadata.csv',
    val_csv='preprocessed/val/metadata/preprocessing_metadata.csv',
    test_csv='preprocessed/test/metadata/preprocessing_metadata.csv',
    batch_size=32
)

# Use in your training loop
for epoch in range(num_epochs):
    train_one_epoch(model, dataloaders['train'], optimizer, criterion)
    validate(model, dataloaders['val'])
```

## 📝 Best Practices

1. **Always use same preprocessing** for train/val/test/inference
2. **Compute normalization stats** from training set only
3. **Review quality report** before removing images
4. **Keep configuration** for reproducibility
5. **Document changes** to preprocessing
6. **Test on single image** before batch processing
7. **Validate outputs** with sample visualizations
8. **Back up original data** before preprocessing

## 🎉 Summary

The preprocessing pipeline provides:

✅ **Standardized inputs** (224×224 RGB)  
✅ **Proper normalization** (dataset-specific)  
✅ **Quality assurance** (filtering + flagging)  
✅ **Label encoding** (integer IDs)  
✅ **PyTorch integration** (Dataset + DataLoader)  
✅ **Consistency** (training = inference)  
✅ **Reproducibility** (config + random seed)  
✅ **Documentation** (rationale + metadata)  

**Ready to train!** 🚀

---

**Version**: 1.0  
**Date**: December 10, 2025  
**Author**: Preprocessing Pipeline Architect
