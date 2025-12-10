# Dataset Merger - Complete Guide

## Overview

The **Dataset Merger** is a comprehensive tool for integrating multiple plant disease classification datasets into a single, unified, high-quality dataset with proper structure, metadata, and splits.

## Features

### 🔍 Core Capabilities

1. **Automatic Dataset Scanning**
   - Recursively scans all datasets in the source folder
   - Supports multiple directory structures
   - Extracts class labels from folder hierarchy
   - Handles various image formats (JPG, PNG, BMP, TIFF)

2. **Dual Output Structure**
   - **Organized folders**: `images/train|val|test|holdout/class_name/`
   - **CSV metadata**: Complete metadata table with all image information

3. **Intelligent Deduplication**
   - **MD5 hashing**: Identifies exact duplicates
   - **Perceptual hashing**: Detects near-duplicates
   - Quality-based selection: Retains highest quality version
   - Provenance merging: Preserves all source information

4. **Provenance Management**
   - Tracks complete image history
   - Records dataset source, original path, filename
   - Merges provenance when duplicates are found
   - JSON-formatted for easy parsing

5. **Metadata Enrichment**
   - Image properties: Resolution, aspect ratio, format
   - File information: Size, modification date
   - Quality metrics: Sharpness score using Laplacian variance
   - EXIF data extraction when available

6. **Similarity Clustering**
   - Groups similar images using perceptual hashing
   - Prevents related images from splitting across sets
   - Uses DBSCAN clustering algorithm
   - Configurable similarity threshold

7. **Stratified Splits**
   - **Train set**: 70% (default)
   - **Validation set**: 15% (default)
   - **Test set**: 15% (default)
   - **Hold-out set**: 10% (reserved)
   - Class-balanced splitting
   - Reproducible with random seed

8. **Comprehensive Reporting**
   - Detailed merge summary
   - Duplicate analysis report
   - Provenance tracking
   - Cluster assignments
   - Split distributions

## Installation

### Prerequisites

```bash
# Activate your virtual environment
cd ai_services
drukFarmVenv\Scripts\activate

# Install required packages
pip install numpy pandas pillow opencv-python scikit-learn imagehash
```

### Dependencies

- **Python**: 3.8+
- **NumPy**: Array operations and numerical computing
- **Pandas**: Data manipulation and CSV handling
- **Pillow (PIL)**: Image loading and processing
- **OpenCV**: Image quality assessment
- **Scikit-learn**: Clustering algorithms
- **ImageHash**: Perceptual hashing

## Usage

### Basic Usage

```bash
# Merge all datasets in 'myDatasets' folder
python dataset_merger.py --datasets-root myDatasets
```

### Advanced Usage

```bash
# Custom configuration
python dataset_merger.py \
    --datasets-root myDatasets \
    --output-root merged_dataset_custom \
    --train-ratio 0.75 \
    --val-ratio 0.15 \
    --test-ratio 0.10 \
    --holdout-ratio 0.10 \
    --random-seed 42
```

### Command-Line Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--datasets-root` | `myDatasets` | Root folder containing all source datasets |
| `--output-root` | `datasets_root/merged_dataset` | Output location for merged dataset |
| `--train-ratio` | `0.7` | Proportion of data for training (70%) |
| `--val-ratio` | `0.15` | Proportion of data for validation (15%) |
| `--test-ratio` | `0.15` | Proportion of data for test (15%) |
| `--holdout-ratio` | `0.10` | Proportion reserved for hold-out (10%) |
| `--random-seed` | `42` | Random seed for reproducibility |

## Output Structure

### Directory Layout

```
merged_dataset/
├── images/                      # Organized image files
│   ├── train/
│   │   ├── class_name_1/
│   │   │   ├── dataset1_image001.jpg
│   │   │   ├── dataset2_image002.jpg
│   │   │   └── ...
│   │   ├── class_name_2/
│   │   └── ...
│   ├── val/
│   │   └── [same structure]
│   ├── test/
│   │   └── [same structure]
│   └── holdout/
│       └── [same structure]
│
├── metadata/                    # Metadata CSV files
│   ├── merged_metadata.csv      # Complete image metadata
│   ├── provenance_map.csv       # Provenance tracking
│   ├── similarity_clusters.csv  # Cluster assignments
│   └── split_files_list.csv     # Train/val/test/holdout lists
│
└── reports/                     # Analysis reports
    ├── duplicates_report.csv    # Duplicate analysis
    └── merge_summary_report.txt # Complete summary
```

### Metadata Files

#### 1. merged_metadata.csv

Complete metadata for all images (including duplicates):

| Column | Description |
|--------|-------------|
| `image_id` | Unique identifier |
| `original_path` | Original file path |
| `filename` | Original filename |
| `dataset_source` | Source dataset name |
| `canonical_class` | Normalized class label |
| `width`, `height` | Image dimensions |
| `resolution` | Total pixels (width × height) |
| `aspect_ratio` | Width / height ratio |
| `format` | Image format (JPEG, PNG, etc.) |
| `mode` | Color mode (RGB, L, etc.) |
| `file_size` | File size in bytes |
| `file_size_mb` | File size in megabytes |
| `modified_date` | Last modification date |
| `md5_hash` | MD5 hash for exact duplicate detection |
| `perceptual_hash` | pHash for near-duplicate detection |
| `exif_data` | EXIF metadata (JSON) |
| `provenance` | Complete provenance chain (JSON) |
| `is_duplicate` | Boolean flag |
| `duplicate_of` | Image ID of primary version |
| `quality_score` | Image quality (0-100) |
| `cluster_id` | Similarity cluster ID |
| `split` | Train/val/test/holdout assignment |
| `merged_path` | Path in merged dataset |

#### 2. provenance_map.csv

Detailed provenance tracking:

| Column | Description |
|--------|-------------|
| `image_id` | Image identifier |
| `canonical_class` | Class label |
| `dataset_source` | Source dataset |
| `original_path` | Original file path |
| `original_filename` | Original filename |
| `scan_date` | When image was scanned |

#### 3. similarity_clusters.csv

Similarity cluster assignments:

| Column | Description |
|--------|-------------|
| `image_id` | Image identifier |
| `filename` | Image filename |
| `canonical_class` | Class label |
| `cluster_id` | Assigned cluster ID |
| `perceptual_hash` | Perceptual hash value |

#### 4. split_files_list.csv

Dataset split assignments:

| Column | Description |
|--------|-------------|
| `image_id` | Image identifier |
| `filename` | Image filename |
| `canonical_class` | Class label |
| `split` | train/val/test/holdout |
| `merged_path` | Path in merged dataset |
| `dataset_source` | Original dataset |

#### 5. duplicates_report.csv

Duplicate analysis:

| Column | Description |
|--------|-------------|
| `primary_image_id` | ID of kept image |
| `primary_filename` | Filename of kept image |
| `primary_quality` | Quality score of kept image |
| `duplicate_image_id` | ID of duplicate |
| `duplicate_filename` | Filename of duplicate |
| `duplicate_quality` | Quality score of duplicate |
| `md5_hash` | Common MD5 hash |
| `perceptual_hash` | Common perceptual hash |

## How It Works

### Pipeline Stages

#### Stage 1: Dataset Scanning

1. Identifies all dataset folders
2. Recursively finds all image files
3. Extracts class labels from directory structure
4. Collects comprehensive metadata

**Class Label Extraction Logic:**
- Skips common split names: `train`, `val`, `test`, `images`
- Uses the last non-split directory as class name
- Normalizes class names (lowercase, spaces instead of underscores)

#### Stage 2: Deduplication

1. **Exact Duplicates (MD5)**
   - Computes MD5 hash for each file
   - Groups files with identical hashes
   - Identifies bit-for-bit identical files

2. **Near Duplicates (Perceptual Hash)**
   - Computes perceptual hash (pHash)
   - Groups visually similar images
   - Detects cropped, resized, or slightly modified versions

3. **Quality-Based Selection**
   - Computes quality score using Laplacian variance
   - Retains highest quality version
   - Merges provenance from all duplicates

#### Stage 3: Similarity Clustering

1. Extracts perceptual hashes for unique images
2. Computes pairwise Hamming distances
3. Applies DBSCAN clustering
4. Assigns cluster IDs to similar images

**Purpose:** Ensures that similar images (e.g., same plant/leaf) stay in the same split to prevent data leakage.

#### Stage 4: Stratified Splitting

1. Groups images by class
2. Shuffles within each class
3. Allocates to splits maintaining class balance:
   - First: Reserve hold-out set (10%)
   - Then: Split remaining into train/val/test
4. Ensures reproducibility with random seed

#### Stage 5: Output Creation

1. Creates organized directory structure
2. Copies images to appropriate split/class folders
3. Renames files to include dataset source
4. Updates paths in metadata

#### Stage 6: Report Generation

1. Generates comprehensive CSV files
2. Creates human-readable summary report
3. Computes final statistics
4. Documents all decisions and transformations

## Quality Metrics

### Image Quality Score

The quality score (0-100) is computed using:

```python
# Laplacian variance (sharpness measure)
laplacian_var = cv2.Laplacian(grayscale_image, cv2.CV_64F).var()
quality_score = min(100, laplacian_var / 10)
```

**Interpretation:**
- **High (>70)**: Sharp, clear images
- **Medium (30-70)**: Acceptable quality
- **Low (<30)**: Blurry or poor quality

### Duplicate Detection

**Exact Duplicates:**
- MD5 hash matches exactly
- Bit-for-bit identical files

**Near Duplicates:**
- Perceptual hash Hamming distance < threshold (default: 5)
- Visually similar but may have minor differences

## Best Practices

### 1. Prepare Your Datasets

Organize source datasets in a consistent structure:

```
myDatasets/
├── Dataset_1/
│   ├── train/
│   │   ├── class_a/
│   │   └── class_b/
│   └── test/
│       ├── class_a/
│       └── class_b/
├── Dataset_2/
│   ├── class_a/
│   └── class_b/
└── Dataset_3/
    └── images/
        ├── class_a/
        └── class_b/
```

### 2. Check Available Space

Ensure sufficient disk space:
- Original datasets size × 1.5 (for copies + metadata)

### 3. Review Class Names

After initial run, check the classes found in the summary report. You may need to:
- Rename folders if class names are inconsistent
- Merge similar classes manually

### 4. Validate Splits

Before training, verify:
- Class balance across splits
- No data leakage (check cluster assignments)
- Hold-out set is untouched

### 5. Backup Original Data

Always keep original datasets intact:
- Merger creates copies, not moves
- Original data remains unchanged

## Troubleshooting

### Issue: Out of Memory

**Solution:** Process datasets in batches
```python
# Modify the script to process subsets
# Or increase available RAM
```

### Issue: Class Names Not Recognized

**Solution:** Check directory structure
- Ensure images are in class-named folders
- Remove or rename non-standard directories

### Issue: Too Many Duplicates

**Solution:** Review quality threshold
- Check `quality_score` distribution
- Manually inspect duplicate groups

### Issue: Unbalanced Splits

**Solution:** Adjust ratios or use minimum samples
- Some classes may be too small
- Consider combining rare classes

## Advanced Configuration

### Programmatic Usage

```python
from dataset_merger import DatasetMerger

# Create merger instance
merger = DatasetMerger(
    datasets_root='myDatasets',
    output_root='merged_output'
)

# Customize pipeline
merger.scan_datasets()
merger.deduplicate_images()
merger.cluster_similar_images(similarity_threshold=4.0)  # Stricter
merger.create_stratified_splits(
    train_ratio=0.8,
    val_ratio=0.1,
    test_ratio=0.1,
    holdout_ratio=0.05
)
merger.create_output_structure()
merger.generate_metadata_files()
merger.generate_summary_report()
```

### Custom Class Normalization

Modify `_normalize_class_name()` method:

```python
def _normalize_class_name(self, class_name: str) -> str:
    # Add custom mappings
    mappings = {
        'early_blight': 'early blight',
        'late_blight': 'late blight',
        # ... more mappings
    }
    
    normalized = class_name.lower()
    return mappings.get(normalized, normalized)
```

### Custom Quality Assessment

Modify `_compute_quality_score()` method:

```python
def _compute_quality_score(self, img: Image.Image) -> float:
    # Add custom metrics
    # - Brightness/contrast
    # - Color distribution
    # - Edge detection
    # - etc.
    pass
```

## Performance Considerations

### Expected Runtime

| Dataset Size | Images | Approximate Time |
|--------------|--------|------------------|
| Small | <10,000 | 2-5 minutes |
| Medium | 10,000-50,000 | 10-30 minutes |
| Large | 50,000-100,000 | 30-60 minutes |
| Very Large | >100,000 | 1-2 hours |

*Times vary based on hardware, image sizes, and duplicate count.*

### Optimization Tips

1. **Use SSD storage** for faster I/O
2. **Increase RAM** for larger datasets
3. **Disable EXIF extraction** if not needed
4. **Reduce similarity threshold** to skip clustering

## Integration with Other Tools

### With Dataset Curator

```bash
# First: Merge datasets
python dataset_merger.py --datasets-root myDatasets

# Then: Curate and clean
python dataset_curator.py --dataset-path merged_dataset/images/train
```

### With Label Taxonomy Designer

```bash
# After merging, design taxonomy
python label_taxonomy_designer.py --dataset-path merged_dataset

# Update class names based on taxonomy
# Re-organize if needed
```

### With Training Pipeline

```python
import pandas as pd

# Load metadata
metadata = pd.read_csv('merged_dataset/metadata/split_files_list.csv')

# Get training images
train_images = metadata[metadata['split'] == 'train']

# Use in DataLoader
# ... your training code
```

## FAQ

**Q: Can I merge datasets with different image formats?**  
A: Yes, the merger handles JPG, PNG, BMP, and TIFF automatically.

**Q: What if class names differ across datasets?**  
A: The merger normalizes names, but you may need to manually map similar classes.

**Q: Are original files modified?**  
A: No, the merger only reads originals and creates copies in the output folder.

**Q: Can I run the merger multiple times?**  
A: Yes, but it will recreate the output folder. Back up previous runs if needed.

**Q: How do I add new datasets later?**  
A: Add new folders to `myDatasets` and re-run the merger.

**Q: Can I customize split ratios?**  
A: Yes, use command-line arguments or modify the code.

**Q: What about augmented datasets?**  
A: Treat them as separate datasets. The merger will detect duplicates if augmentation created them.

## Next Steps

After merging:

1. ✅ Review summary report
2. ✅ Inspect class distributions
3. ✅ Validate a sample of images
4. ✅ Check duplicate report
5. ✅ Proceed with data augmentation (if needed)
6. ✅ Begin model training

## Support

For issues or questions:
1. Check this guide
2. Review summary report for diagnostics
3. Inspect metadata CSV files
4. Check console output for errors

---

**Version:** 1.0  
**Last Updated:** December 10, 2025  
**Author:** Dataset Integration Engineer
