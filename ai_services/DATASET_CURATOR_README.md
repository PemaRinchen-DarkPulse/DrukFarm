# Dataset Curator - Plant Disease Detection

## Overview
Comprehensive dataset analysis tool for multi-dataset plant disease detection systems.

## Features
- ✅ Automatic scanning of all nested dataset folders
- ✅ CSV manifest generation per dataset
- ✅ Detailed statistics (class distribution, resolution, color modes)
- ✅ Duplicate detection (MD5 exact + perceptual hash near-duplicates)
- ✅ Label semantic analysis and conflict detection
- ✅ Image quality assessment (blur, brightness, aspect ratio)
- ✅ Manual inspection sample export (20 images per class)
- ✅ Comprehensive health report

## Installation

### 1. Activate Virtual Environment
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
```

### 2. Install Dependencies
```cmd
pip install -r requirements_curator.txt
```

## Usage

### Quick Start
```cmd
python dataset_curator.py
```

The script will:
1. Scan all 11 datasets in `myDatasets/` folder
2. Generate manifests and statistics
3. Detect duplicates
4. Analyze label conflicts
5. Assess image quality
6. Export sample images for manual review
7. Generate comprehensive health report

### Output Structure
```
dataset_analysis_output/
├── manifests/
│   ├── master_manifest.csv
│   └── [dataset_name]_images.csv (per dataset)
├── statistics/
│   ├── class_distribution.csv
│   ├── resolution_statistics.csv
│   ├── color_mode_distribution.csv
│   ├── label_conflicts.csv
│   ├── label_mapping.csv
│   └── quality_issues.csv
├── duplicates/
│   ├── exact_duplicates_md5.csv
│   └── near_duplicates_phash.csv
├── manual_inspection_samples/
│   └── [class_name]/
│       └── 001_[dataset]_[image].jpg
└── reports/
    └── dataset_health_report.txt
```

## CSV Outputs Explained

### master_manifest.csv
Dataset-level overview with image counts, classes, formats, and resolution ranges.

### class_distribution.csv
All unique classes across datasets with image counts and source datasets.

### resolution_statistics.csv
Min/max/median width/height and file sizes per dataset.

### label_conflicts.csv
Potential naming inconsistencies (e.g., "blight" vs "early_blight").

### exact_duplicates_md5.csv
Identical images (byte-for-byte) across datasets - candidates for removal.

### near_duplicates_phash.csv
Visually similar images - may indicate data augmentation or slight variations.

### quality_issues.csv
Images with potential problems:
- Too small/large resolution
- Extreme aspect ratios
- Too dark/bright
- Blurry (low Laplacian variance)
- Corrupted/unreadable

## Manual Inspection Samples
The tool exports 20 representative images per class to `manual_inspection_samples/`.
Use these to:
- Verify label accuracy
- Check image quality
- Identify mislabeled data
- Assess class consistency

## Customization

Edit `dataset_curator.py` to adjust:
- `samples_per_class` (default: 20)
- Quality thresholds (brightness, blur, size limits)
- Image extensions
- Output directory

## Next Steps

After analysis:
1. Review `reports/dataset_health_report.txt`
2. Check `statistics/label_conflicts.csv` for naming issues
3. Inspect duplicates and decide on removal strategy
4. Manually review samples in `manual_inspection_samples/`
5. Address quality issues from `statistics/quality_issues.csv`
6. Create standardized label mapping
7. Plan data preprocessing pipeline

## Performance Notes
- Full analysis on ~50k images takes approximately 10-30 minutes
- Quality assessment samples first 1000 images (configurable)
- Perceptual hashing is CPU-intensive for large datasets

## Troubleshooting

**Error: No module named 'imagehash'**
```cmd
pip install ImageHash
```

**Error: cv2 not found**
```cmd
pip install opencv-python
```

**Memory issues with large datasets**
- Process datasets individually by modifying the scan function
- Reduce quality assessment sample size
- Skip perceptual hashing for very large datasets

## License
Internal tool for DrukFarm project.
