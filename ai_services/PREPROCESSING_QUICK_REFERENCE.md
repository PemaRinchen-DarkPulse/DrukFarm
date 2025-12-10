# Preprocessing Pipeline - Quick Reference

**Version:** 1.0  
**Last Updated:** December 10, 2025

---

## ⚡ Quick Start

```python
from preprocessing_pipeline import PreprocessingConfig, DatasetPreprocessor

# Default preprocessing
config = PreprocessingConfig()
preprocessor = DatasetPreprocessor(
    dataset_path='merged_dataset/images/train',
    output_path='preprocessed/train',
    config=config
)
metadata_df = preprocessor.run()
```

---

## 🔧 Common Commands

### 1. Basic Preprocessing
```python
config = PreprocessingConfig()
preprocessor = DatasetPreprocessor('dataset', 'output', config)
metadata = preprocessor.run()
```

### 2. Custom Quality Thresholds
```python
config = PreprocessingConfig(
    blur_threshold=150.0,
    brightness_min=20.0,
    brightness_max=235.0,
    remove_low_quality=False
)
```

### 3. Enable Enhancements
```python
config = PreprocessingConfig(
    enable_contrast_normalization=True,
    enable_denoising=True
)
```

### 4. Compute Normalization Stats
```python
from preprocessing_pipeline import PreprocessingPipeline

pipeline = PreprocessingPipeline(PreprocessingConfig())
mean, std = pipeline.compute_normalization_stats(image_paths)
```

### 5. PyTorch DataLoader
```python
from preprocessing_pytorch import create_dataloaders

dataloaders = create_dataloaders(
    data_dir='preprocessed',
    batch_size=32,
    augment_train=True
)

train_loader = dataloaders['train']
val_loader = dataloaders['val']
```

### 6. Single Image Inference
```python
from preprocessing_pytorch import InferencePreprocessor

preprocessor = InferencePreprocessor.from_metadata_dir('preprocessed/train/metadata')
tensor = preprocessor.preprocess('path/to/image.jpg')
```

---

## 📋 Configuration Quick Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `target_size` | (224, 224) | Final image size |
| `use_aspect_preserving` | True | Preserve aspect ratio |
| `normalization_mean` | None | RGB mean (auto-computed) |
| `normalization_std` | None | RGB std (auto-computed) |
| `blur_threshold` | 100.0 | Laplacian variance threshold |
| `brightness_min` | 30.0 | Minimum brightness |
| `brightness_max` | 225.0 | Maximum brightness |
| `contrast_min` | 20.0 | Minimum contrast |
| `remove_low_quality` | False | Remove vs flag bad images |
| `enable_contrast_normalization` | False | Apply CLAHE |
| `enable_denoising` | False | Apply denoising |

---

## 📂 Output File Structure

```
preprocessed/
└── train/
    ├── metadata/
    │   ├── preprocessing_metadata.csv    # Full metadata
    │   ├── dataset_mean_std.csv         # Normalization stats
    │   ├── label_map.csv                # Class ID mapping
    │   ├── low_quality_report.csv       # Quality issues
    │   └── preprocessing_config.json    # Configuration used
    └── images/
        └── [class_name]/
            └── [filename].jpg
```

---

## 📊 Metadata CSV Columns

**preprocessing_metadata.csv:**
- `original_path`: Source image path
- `preprocessed_path`: Output image path (if saved)
- `canonical_class`: Class name
- `label_id`: Encoded label (0-based)
- `original_width`, `original_height`: Source dimensions
- `preprocessed_width`, `preprocessed_height`: Output dimensions
- `blur_score`: Laplacian variance
- `brightness`, `contrast`: Intensity metrics
- `is_blurry`, `is_too_dark`, `is_too_bright`, `is_low_contrast`: Quality flags
- `is_low_quality`: Combined quality flag

**dataset_mean_std.csv:**
- `channel`: R, G, B
- `mean`: Per-channel mean (0-1 range)
- `std`: Per-channel std

**label_map.csv:**
- `class_id`: Integer label (0-based)
- `class_name`: Class name

---

## 🔄 Workflow Examples

### Full Pipeline (Train/Val/Test)

```python
config = PreprocessingConfig()

# Step 1: Process training set (compute normalization)
train_proc = DatasetPreprocessor('merged/images/train', 'prep/train', config)
train_metadata = train_proc.run()

# Get stats
mean = train_proc.pipeline.mean
std = train_proc.pipeline.std
class_to_id = train_proc.pipeline.class_to_id

# Step 2: Process validation set
val_proc = DatasetPreprocessor('merged/images/val', 'prep/val', config)
val_proc.pipeline.mean = mean
val_proc.pipeline.std = std
val_proc.pipeline.class_to_id = class_to_id
val_metadata = val_proc.scan_dataset()
val_processed = val_proc.process_dataset(val_metadata, compute_normalization=False)
val_proc.save_outputs(val_processed)

# Step 3: Process test set (same approach)
test_proc = DatasetPreprocessor('merged/images/test', 'prep/test', config)
test_proc.pipeline.mean = mean
test_proc.pipeline.std = std
test_proc.pipeline.class_to_id = class_to_id
test_metadata = test_proc.scan_dataset()
test_processed = test_proc.process_dataset(test_metadata, compute_normalization=False)
test_proc.save_outputs(test_processed)
```

### Training with PyTorch

```python
from preprocessing_pytorch import create_dataloaders
import torch.nn as nn
import torch.optim as optim

# Create DataLoaders
dataloaders = create_dataloaders(
    data_dir='preprocessed',
    batch_size=32,
    augment_train=True,
    num_workers=4
)

# Training loop
model = YourModel(num_classes=dataloaders['num_classes'])
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters())

for epoch in range(epochs):
    for images, labels in dataloaders['train']:
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
```

### Inference Pipeline

```python
from preprocessing_pytorch import InferencePreprocessor
import torch

# Initialize
preprocessor = InferencePreprocessor.from_metadata_dir('preprocessed/train/metadata')
model = torch.load('model.pth')
model.eval()

# Predict
image_tensor = preprocessor.preprocess('path/to/image.jpg')
with torch.no_grad():
    output = model(image_tensor)
    predicted_id = output.argmax(dim=1).item()

# Get class name
predicted_class = preprocessor.id_to_class[predicted_id]
print(f"Predicted: {predicted_class}")
```

---

## 🚨 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Images too dark | Decrease `brightness_min` |
| Images too bright | Increase `brightness_max` |
| Too many blurry images flagged | Decrease `blur_threshold` |
| Out of memory during preprocessing | Use `save_images=False`, process metadata only |
| Normalization values seem wrong | Ensure using training set only, check sample_size |
| Class imbalance | Use weighted loss or data augmentation |
| Low contrast images | Enable `enable_contrast_normalization=True` |
| Noisy images | Enable `enable_denoising=True` |

---

## 🔗 Integration Points

### With Dataset Merger
```python
# After merging datasets
from dataset_merger import DatasetMerger

merger = DatasetMerger('myDatasets', 'merged_dataset')
merger.merge()

# Preprocess merged output
config = PreprocessingConfig()
for split in ['train', 'val', 'test']:
    preprocessor = DatasetPreprocessor(
        f'merged_dataset/images/{split}',
        f'preprocessed/{split}',
        config
    )
    preprocessor.run()
```

### With Training Scripts
```python
# Import preprocessed data
from preprocessing_pytorch import create_dataloaders

dataloaders = create_dataloaders('preprocessed', batch_size=32)

# Your training code
model.fit(dataloaders['train'], dataloaders['val'])
```

### With Inference Server
```python
# Load preprocessor once at startup
from preprocessing_pytorch import InferencePreprocessor

preprocessor = InferencePreprocessor.from_metadata_dir('preprocessed/train/metadata')

# Use in prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    image = request.files['image']
    tensor = preprocessor.preprocess(image)
    prediction = model(tensor)
    return jsonify({'class': id_to_class[prediction.argmax()]})
```

---

## 📚 See Also

- **Full Guide:** `PREPROCESSING_GUIDE.md`
- **Examples:** `preprocessing_examples.py`
- **Implementation Details:** `PREPROCESSING_IMPLEMENTATION_SUMMARY.md`
- **PyTorch Integration:** `preprocessing_pytorch.py`
- **Core Pipeline:** `preprocessing_pipeline.py`

---

**Quick Help:**
- Run examples: `python preprocessing_examples.py`
- Check config: `python -c "from preprocessing_pipeline import PreprocessingConfig; print(PreprocessingConfig())"`
- Validate installation: `python -c "import cv2, PIL, torch; print('OK')"`
