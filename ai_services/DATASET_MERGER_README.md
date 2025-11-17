# 🌿 Dataset Merger - Multi-Dataset Integration System

## Overview

The **Dataset Merger** is a comprehensive system for integrating multiple plant disease classification datasets into a single, unified, high-quality dataset. It handles deduplication, provenance tracking, intelligent splitting, and quality assessment.

## 🎯 Features

### 1. **Automatic Dataset Scanning**
- Recursively scans all datasets in the `myDatasets` folder
- Supports JPG, PNG, BMP, TIFF formats
- Automatically extracts class labels from directory structure
- Handles various dataset organization patterns (train/val/test, augmented/original, etc.)

### 2. **Dual Output Structure**
Creates two complementary outputs:
- **Structured directories**: `merged_dataset/{split}/{class}/{dataset_source}/images`
- **Unified CSV metadata**: Complete metadata table with all image information

### 3. **Deduplication System**
- **MD5 hashing**: Detects exact duplicates
- **Perceptual hashing**: Finds near-duplicates (rotated, slightly modified images)
- **Quality-based selection**: Keeps the highest quality image when duplicates exist
- **Provenance preservation**: Tracks all duplicate sources

### 4. **Provenance Management**
Tracks complete history for each image:
- Dataset source
- Original path and filename
- MD5 and perceptual hashes
- Duplicate resolution decisions
- Quality scores

### 5. **Metadata Enrichment**
Extracts comprehensive metadata:
- Resolution (width × height)
- Aspect ratio
- File size and format
- Color mode
- Quality score (0-100)
- Sharpness metrics
- Augmentation detection

### 6. **Cluster-Based Partitioning**
- Uses perceptual hashing to group similar images
- Prevents related images from splitting across train/val/test
- Employs DBSCAN clustering algorithm
- Maintains group integrity during splitting

### 7. **Geographic/Source-Aware Splits**
- Prioritizes dataset diversity in test sets
- Ensures different datasets are represented in holdout
- Maximizes domain generalization capability

### 8. **Reserved Hold-Out Set (10%)**
- Creates a completely separate 10% holdout set
- Draws from diverse dataset sources
- Remains untouched until final model evaluation
- Ensures unbiased performance assessment

### 9. **Clean Train/Validation/Test Split**
Default split ratios (customizable):
- **Train**: 70%
- **Validation**: 15%
- **Test**: 15%
- **Holdout**: 10%

All splits are:
- Stratified by class
- Cluster-aware (keeps similar images together)
- Source-diverse (especially holdout and test sets)

### 10. **Comprehensive Deliverables**

Generated outputs:
1. `merged_dataset/` - Organized image folders
2. `reports/merged_metadata.csv` - Complete image metadata
3. `reports/provenance_map.csv` - Full provenance tracking
4. `reports/duplicates_report.csv` - List of removed duplicates
5. `reports/similarity_clusters.csv` - Image clustering results
6. `reports/split_files_list.csv` - Split assignments
7. `reports/MERGE_SUMMARY.md` - Comprehensive summary report

## 📋 Prerequisites

### Python Environment
Python 3.8 or higher required.

### Install Dependencies
```bash
pip install -r requirements.txt
```

Dependencies include:
- `numpy` - Numerical operations
- `pandas` - Data manipulation
- `pillow` - Image processing
- `opencv-python` - Computer vision tasks
- `scikit-learn` - Clustering and splitting
- `imagehash` - Perceptual hashing

## 🚀 Usage

### Basic Usage

```bash
python dataset_merger.py
```

The script will:
1. Scan all datasets in `myDatasets/`
2. Analyze and extract metadata
3. Detect and remove duplicates
4. Cluster similar images
5. Create train/val/test/holdout splits
6. Organize merged dataset
7. Generate comprehensive reports

### Configuration

Edit the `main()` function in `dataset_merger.py` to customize:

```python
# Dataset locations
DATASETS_ROOT = r"path/to/your/datasets"
OUTPUT_ROOT = r"path/to/output"

# Splitting ratios (in DatasetSplitter)
splitter = DatasetSplitter(
    train_ratio=0.7,      # 70% for training
    val_ratio=0.15,       # 15% for validation
    test_ratio=0.15,      # 15% for testing
    holdout_ratio=0.1     # 10% for holdout
)

# Deduplication threshold (in DeduplicationEngine)
deduplicator = DeduplicationEngine(
    perceptual_threshold=5  # Hamming distance threshold
)

# Clustering parameters (in SimilarityClusterer)
clusterer = SimilarityClusterer(
    eps=0.3,           # DBSCAN epsilon
    min_samples=2      # Minimum cluster size
)
```

## 📊 Quality Scoring System

Images are scored 0-100 based on:

| Metric | Points | Criteria |
|--------|--------|----------|
| **Resolution** | 0-40 | Higher resolution = more points |
| **Aspect Ratio** | 0-10 | Standard ratios (0.5-2.0) preferred |
| **Sharpness** | 0-30 | Laplacian variance (blur detection) |
| **File Size** | 0-20 | Optimal range: 50KB - 5MB |

**Total Score**: Sum of all metrics (max 100)

Higher quality images are kept when duplicates are detected.

## 🔄 Workflow

```
┌─────────────────────────┐
│  Scan All Datasets      │
│  (myDatasets folder)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Analyze Images         │
│  (metadata extraction)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Deduplicate            │
│  (MD5 + perceptual)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Cluster Similarity     │
│  (DBSCAN on hashes)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create Splits          │
│  (stratified + cluster) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Organize Files         │
│  (copy to structure)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Generate Reports       │
│  (CSV + markdown)       │
└─────────────────────────┘
```

## 📁 Output Structure

```
merged_output/
├── merged_dataset/
│   ├── train/
│   │   ├── Anthracnose/
│   │   │   ├── BPLD Dataset/
│   │   │   │   └── image1.jpg
│   │   │   └── Other Dataset/
│   │   │       └── image2.jpg
│   │   ├── Healthy/
│   │   └── ...
│   ├── val/
│   │   └── ...
│   ├── test/
│   │   └── ...
│   └── holdout/
│       └── ...
└── reports/
    ├── merged_metadata.csv
    ├── provenance_map.csv
    ├── duplicates_report.csv
    ├── similarity_clusters.csv
    ├── split_files_list.csv
    └── MERGE_SUMMARY.md
```

## 📈 Understanding Reports

### merged_metadata.csv
Complete metadata for all unique images:
- `image_path`: Original image location
- `canonical_class`: Normalized class name
- `dataset_source`: Source dataset
- `md5_hash`: File content hash
- `perceptual_hash`: Visual similarity hash
- `resolution`: Width × height
- `quality_score`: 0-100 quality rating
- And more...

### provenance_map.csv
Tracks all images including duplicates:
- `image_id`: MD5 hash identifier
- `kept`: Boolean (was this version kept?)
- `reason`: Why kept or removed
- Full source information

### duplicates_report.csv
Lists all removed duplicates:
- Shows which images were removed
- Indicates which version was kept
- Provides reasoning

### similarity_clusters.csv
Image grouping results:
- `cluster_id`: Cluster assignment (-1 = noise)
- Groups visually similar images
- Used for preventing data leakage

### split_files_list.csv
Final split assignments:
- Maps each image to train/val/test/holdout
- Includes class and dataset source
- Use for custom loading

### MERGE_SUMMARY.md
Human-readable summary:
- Dataset statistics
- Class distributions
- Split percentages
- Quality metrics
- Next steps

## 🔍 Deduplication Details

### Exact Duplicates (MD5)
- Computes MD5 hash of file content
- Groups identical files
- Keeps highest quality version

### Near-Duplicates (Perceptual Hashing)
- Generates 64-bit perceptual hash
- Calculates Hamming distance between hashes
- Threshold: 5 bits difference (customizable)
- Detects:
  - Rotated images
  - Slightly cropped versions
  - Minor color adjustments
  - Compressed versions

### Quality-Based Selection
When duplicates found:
1. Calculate quality score for each
2. Keep highest scoring version
3. Record provenance for all versions
4. Document reason in reports

## 🎯 Clustering Algorithm

Uses **DBSCAN** (Density-Based Spatial Clustering):

**Parameters**:
- `eps=0.3`: Maximum distance for cluster membership
- `min_samples=2`: Minimum points to form cluster
- `metric='hamming'`: Distance metric for binary vectors

**Process**:
1. Convert perceptual hashes to binary vectors
2. Calculate Hamming distances
3. Group similar images
4. Assign cluster IDs

**Benefits**:
- No need to specify cluster count
- Handles noise (outliers)
- Finds arbitrary-shaped clusters

## 📊 Stratified Splitting Strategy

### Holdout Set Creation (10%)
1. Group by dataset and class
2. Take samples from diverse sources
3. Prioritize underrepresented datasets
4. Ensure class balance

### Train/Val/Test Splitting
1. Adjust ratios (excluding holdout)
2. Group by class for stratification
3. Further group by similarity cluster
4. Distribute clusters across splits
5. Maintain class balance
6. Prevent cluster splitting

### Benefits
- **No data leakage**: Similar images stay together
- **Stratified**: Each split has balanced classes
- **Diverse**: Holdout from different sources
- **Generalizable**: Tests on unseen domains

## ⚙️ Customization

### Adjust Split Ratios

```python
splitter = DatasetSplitter(
    train_ratio=0.8,    # 80% train
    val_ratio=0.1,      # 10% val
    test_ratio=0.1,     # 10% test
    holdout_ratio=0.05  # 5% holdout
)
```

### Change Deduplication Sensitivity

```python
# More aggressive (finds more duplicates)
deduplicator = DeduplicationEngine(perceptual_threshold=10)

# More conservative (fewer false positives)
deduplicator = DeduplicationEngine(perceptual_threshold=3)
```

### Modify Clustering

```python
# Larger clusters
clusterer = SimilarityClusterer(eps=0.5, min_samples=3)

# Smaller, tighter clusters
clusterer = SimilarityClusterer(eps=0.2, min_samples=2)
```

### Add Custom Metadata

Extend `ImageMetadata` class:

```python
@dataclass
class ImageMetadata:
    # ... existing fields ...
    custom_field: str = None
```

Update `ImageAnalyzer.analyze_image()` to populate.

## 🐛 Troubleshooting

### Issue: "Out of Memory"
**Solution**: Process in batches, reduce image count, or increase system RAM

### Issue: "Slow Performance"
**Solutions**:
- Reduce image resolution for analysis
- Skip perceptual hashing (comment out)
- Process datasets individually
- Use SSD for faster I/O

### Issue: "Imbalanced Splits"
**Solutions**:
- Adjust split ratios
- Check class distribution in original data
- Modify stratification logic for small classes

### Issue: "Too Many/Few Duplicates"
**Solutions**:
- Adjust `perceptual_threshold`
- Check MD5 duplicates vs perceptual duplicates
- Review quality scoring criteria

## 📚 Advanced Usage

### Process Specific Datasets

```python
# Modify scanner to filter
def scan_all_datasets(self):
    for dataset_folder in self.datasets_root.iterdir():
        # Only process specific datasets
        if dataset_folder.name in ['Rice Dataset', 'BPLD Dataset']:
            self._scan_dataset(dataset_folder)
```

### Export for PyTorch/TensorFlow

```python
# Read split assignments
df = pd.read_csv('reports/split_files_list.csv')

# Create PyTorch dataset
from torch.utils.data import Dataset

class MergedDataset(Dataset):
    def __init__(self, split='train'):
        self.data = df[df['split'] == split]
    
    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        # Load and transform image
        # Return image, label
        pass
```

### Filter by Quality

```python
# Only keep high-quality images
df = pd.read_csv('reports/merged_metadata.csv')
high_quality = df[df['quality_score'] > 70]
```

## 📖 Best Practices

1. **Backup Original Data**: Never modify source datasets
2. **Review Reports**: Check duplicates and class distribution
3. **Validate Splits**: Ensure no data leakage
4. **Test Holdout Last**: Don't peek at holdout until final evaluation
5. **Document Changes**: Keep merge summary for reproducibility
6. **Version Control**: Tag merged dataset versions
7. **Quality Check**: Manually inspect sample images from each split

## 🔮 Future Enhancements

Potential improvements:
- [ ] GUI interface for configuration
- [ ] Parallel processing for large datasets
- [ ] Advanced augmentation detection
- [ ] Automatic class name normalization
- [ ] Integration with annotation tools
- [ ] Cloud storage support (S3, Azure Blob)
- [ ] Real-time progress visualization
- [ ] Automated quality assessment reports
- [ ] Support for video datasets
- [ ] Multi-modal data support (images + text)

## 📞 Support

For issues or questions:
1. Check reports in `merged_output/reports/`
2. Review this documentation
3. Examine log outputs during execution
4. Verify input dataset structure

## 📄 License

This tool is part of the DrukFarm project.

---

**Created by**: Dataset Integration Engineer  
**Last Updated**: November 2025  
**Version**: 1.0.0
