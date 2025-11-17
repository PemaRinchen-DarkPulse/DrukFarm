# 🌿 Plant Disease Dataset Curation System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Complete Workflow](#complete-workflow)
5. [Files Reference](#files-reference)
6. [Outputs Explained](#outputs-explained)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This comprehensive dataset curation system analyzes, validates, and prepares multiple plant disease datasets for deep learning model training. It performs:

✅ **Automated Dataset Inventory** - Scans 11 datasets automatically  
✅ **Manifest Generation** - CSV exports of all metadata  
✅ **Statistical Analysis** - Class distribution, resolution stats, quality metrics  
✅ **Duplicate Detection** - MD5 (exact) + perceptual hashing (near-duplicates)  
✅ **Label Conflict Detection** - Finds naming inconsistencies  
✅ **Quality Assessment** - Identifies blur, size issues, brightness problems  
✅ **Sample Export** - 20 images per class for manual review  
✅ **Visualization Suite** - Charts and graphs of all metrics  
✅ **Data Cleaning Tools** - Semi-automated cleanup workflow  

---

## Installation

### Prerequisites
- Python 3.8+ (already installed in your virtual environment)
- Windows OS (scripts optimized for CMD)

### Setup Steps

1. **Navigate to ai_services folder**
```cmd
cd c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services
```

2. **Activate virtual environment**
```cmd
drukFarmVenv\Scripts\activate
```

3. **Install dependencies**
```cmd
pip install -r requirements.txt
```

**Dependencies installed:**
- numpy, pandas - Data manipulation
- Pillow, OpenCV - Image processing
- ImageHash - Perceptual hashing
- matplotlib, seaborn - Visualizations
- tqdm - Progress bars

---

## Quick Start

### Recommended Method
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
python dataset_visualizer.py
```

These commands:
1. Run full dataset analysis
2. Generate visualizations
5. Opens output folder automatically

**Expected runtime:** 10-30 minutes depending on dataset size

---

## Complete Workflow

### Phase 1: Initial Analysis

**Step 1 - Run Curator**
```cmd
python dataset_curator.py
```

What happens:
- Scans all 11 datasets in `myDatasets/`
- Extracts metadata from every image
- Computes MD5 and perceptual hashes
- Identifies class labels from folder structure
- Generates statistics and manifests
- Detects duplicates and quality issues
- Exports sample images for review
- Creates comprehensive health report

**Step 2 - Generate Visualizations**
```cmd
python dataset_visualizer.py
```

What happens:
- Creates bar charts of dataset sizes
- Plots class distribution (top 30)
- Shows resolution ranges
- Visualizes quality issue breakdown
- Generates class-dataset overlap matrix
- Exports summary statistics JSON

**Step 3 - Review Results**

Priority order:
1. **`reports/dataset_health_report.txt`** - Read this first!
2. **Visualizations** - Quick visual overview
3. **`statistics/label_conflicts.csv`** - Naming issues
4. **`duplicates/exact_duplicates_md5.csv`** - Files to remove
5. **Manual inspection samples** - Verify quality

### Phase 2: Data Cleaning (Optional)

**Step 4 - Review Analysis Results**

Open and review:
- Exact duplicates - Which to keep/remove?
- Quality issues - Delete or fix?
- Label conflicts - Standardization strategy?

**Step 5 - Run Cleaner (Interactive)**
```cmd
python dataset_cleaner.py
```

This interactive script:
1. Creates backup of all datasets (RECOMMENDED!)
2. Removes exact duplicates (dry-run first)
3. Deletes quality issue images (dry-run first)
4. Standardizes label names (requires mapping)
5. Generates cleaning report

**⚠️ IMPORTANT:** Always review dry-run output before confirming!

**Step 6 - Re-analyze**

After cleaning, re-run analysis to verify:
```cmd
python dataset_curator.py
```

Compare before/after statistics.

### Phase 3: Next Steps

Based on your cleaned dataset:
1. Design data augmentation strategy
2. Create train/validation/test splits
3. Implement preprocessing pipeline
4. Begin model development

---

## Files Reference

### Scripts You Run

| File | Purpose | When to Use |
|------|---------|-------------|
| `dataset_curator.py` | Core analysis script | Full dataset analysis |
| `dataset_visualizer.py` | Create charts/graphs | After curator runs |
| `dataset_cleaner.py` | Interactive cleaning | After reviewing analysis |

### Configuration Files

| File | Purpose | Edit When |
|------|---------|-----------|
| `curator_config.json` | Analysis parameters | Customize thresholds, paths |
| `requirements.txt` | Python dependencies | Add new libraries |

### Documentation

| File | Purpose |
|------|---------|
| `DATASET_CURATOR_README.md` | Detailed technical docs |
| `QUICK_REFERENCE.md` | Common tasks cheat sheet |
| This file | Complete guide |

---

## Outputs Explained

### Directory Structure
```
dataset_analysis_output/
├── manifests/
│   ├── master_manifest.csv              # All datasets overview
│   ├── BPLD Dataset_images.csv          # Per-dataset inventories
│   ├── Rice Dataset_images.csv
│   └── ...
│
├── statistics/
│   ├── class_distribution.csv           # Image count per class
│   ├── resolution_statistics.csv        # Size/dimension stats
│   ├── color_mode_distribution.csv      # RGB vs Grayscale
│   ├── label_conflicts.csv              # Naming inconsistencies
│   ├── label_mapping.csv                # All labels normalized
│   └── quality_issues.csv               # Problems found
│
├── duplicates/
│   ├── exact_duplicates_md5.csv         # Byte-identical images
│   └── near_duplicates_phash.csv        # Visually similar
│
├── manual_inspection_samples/
│   ├── healthy/                         # 20 samples per class
│   ├── bacterial_blight/
│   ├── fungal_leaf_spot/
│   └── ...
│
├── visualizations/
│   ├── dataset_sizes.png
│   ├── class_distribution_top30.png
│   ├── resolution_distribution.png
│   ├── quality_issues.png
│   ├── class_dataset_overlap.png
│   └── summary_statistics.json
│
└── reports/
    └── dataset_health_report.txt        # Comprehensive summary
```

### Key CSV Columns

**master_manifest.csv**
- Dataset Name, Total Images, Number of Classes
- Min/Max/Median Resolution
- Image Formats

**class_distribution.csv**
- Class Label, Total Images, Number of Datasets
- Datasets (which datasets contain this class)

**exact_duplicates_md5.csv**
- Duplicate Group (unique ID for each set)
- Image Index, Total in Group
- Path, Size (KB) - keep largest

**quality_issues.csv**
- Issue Type (Unreadable, Blurry, Too Small, etc.)
- Path, Details (specific metrics)

---

## Advanced Usage

### Custom Quality Thresholds

Edit `curator_config.json`:
```json
{
  "quality_thresholds": {
    "min_width": 100,          // Default: 50
    "blur_threshold": 150,     // Default: 100 (higher = stricter)
    "min_brightness": 30,      // Default: 20
    "max_brightness": 225      // Default: 235
  }
}
```

### Process Specific Datasets Only

Edit `dataset_curator.py`, modify `scan_datasets()`:
```python
# Around line 67
dataset_folders = [
    f for f in self.datasets_root.iterdir() 
    if f.is_dir() and f.name in ['Rice Dataset', 'BPLD Dataset']
]
```

### Increase Sample Export Count

Edit `dataset_curator.py`, modify export call:
```python
# Around line 640
self.export_manual_inspection_samples(samples_per_class=50)  # Default: 20
```

### Skip Perceptual Hashing (Speed Up)

Edit `curator_config.json`:
```json
{
  "analysis_settings": {
    "enable_perceptual_hashing": false
  }
}
```

Or comment out in `dataset_curator.py`:
```python
# Around line 141
# metadata['phash'] = str(imagehash.average_hash(img))
```

### Export to Excel Instead of CSV

Install dependency:
```cmd
pip install openpyxl
```

Modify save calls in `dataset_curator.py`:
```python
df.to_excel(output_path.with_suffix('.xlsx'), index=False)
```

---

## Troubleshooting

### Common Issues

**Problem:** "ModuleNotFoundError: No module named 'cv2'"  
**Solution:**
```cmd
pip install opencv-python
```

**Problem:** "Permission denied" when running cleaner  
**Solution:**
- Close all files/folders in output directory
- Run CMD as Administrator
- Check antivirus isn't blocking

**Problem:** Analysis takes hours  
**Solution:**
- Edit `dataset_curator.py` line 390
- Change `self.all_images[:1000]` to `[:500]`
- Or set `max_quality_check_images: 500` in config

**Problem:** Out of memory error  
**Solution:**
- Process datasets individually
- Reduce quality assessment sample size
- Close other applications
- Disable perceptual hashing

**Problem:** Corrupted images cause crashes  
**Solution:**
- Errors are already caught in try/except blocks
- Check `quality_issues.csv` for problematic files
- Delete manually and re-run

**Problem:** Label extraction fails (all NULL)  
**Solution:**
- Check dataset folder structure
- Labels extracted from parent folder of images
- Ensure structure: `dataset/class_name/image.jpg`

### Performance Optimization

For 50,000+ images:

1. **Disable visualization generation** (run separately later)
2. **Reduce quality check samples:**
   ```json
   "max_quality_check_images": 500
   ```
3. **Skip perceptual hashing:**
   ```json
   "enable_perceptual_hashing": false
   ```
4. **Use SSD storage** for faster I/O
5. **Close browser/IDE** to free RAM

---

## Best Practices

### Before Analysis
- ✅ Ensure datasets are in correct folder structure
- ✅ Check available disk space (need ~2x dataset size)
- ✅ Close unnecessary applications
- ✅ Have original backups elsewhere

### During Analysis
- ✅ Don't interrupt - let it complete
- ✅ Monitor progress bars
- ✅ Note any error messages

### After Analysis
- ✅ Read health report thoroughly
- ✅ Review visualizations first (quick overview)
- ✅ Check duplicates before removing
- ✅ Manually inspect sample images
- ✅ Document cleaning decisions

### Data Cleaning
- ✅ **ALWAYS backup before cleaning**
- ✅ Use dry-run mode first
- ✅ Review each change type separately
- ✅ Re-run analysis after major changes
- ✅ Keep cleaning logs

---

## Example Workflow

Real-world scenario:

```cmd
# Day 1: Initial Analysis
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
python dataset_visualizer.py

# Review outputs
# - Read dataset_health_report.txt
# - Check visualizations/
# - Review manual_inspection_samples/

# Day 2: Cleaning
python dataset_cleaner.py
# - Create backup
# - Remove exact duplicates (382 images)
# - Delete unreadable images (15 images)

# Day 3: Label Standardization
# Edit dataset_cleaner.py with mapping:
# 'bacterial_spot' -> 'spot_bacterial'
# 'fungal_spot' -> 'spot_fungal'
python dataset_cleaner.py

# Day 4: Verification
python dataset_curator.py
python dataset_visualizer.py
# Compare before/after statistics

# Day 5: Final Dataset Ready
# Total images: 48,203 (from 48,600)
# Duplicates removed: 382
# Quality issues fixed: 15
# Labels standardized: 87 classes -> 79 classes
# Ready for model training!
```

---

## Support & Resources

### Documentation Files
1. `DATASET_CURATOR_README.md` - Full technical reference
2. `QUICK_REFERENCE.md` - Task-based cheat sheet
3. This file - Complete walkthrough

### Generated Reports
- `dataset_health_report.txt` - Automated analysis
- `summary_statistics.json` - Machine-readable stats
- `cleaning_report.json` - Post-cleanup summary

### Contact
For DrukFarm project-specific questions, refer to main project documentation.

---

## Version History

**v1.0 - 2025-11-15**
- Initial release
- Full multi-dataset support
- Duplicate detection (MD5 + pHash)
- Quality assessment
- Label conflict detection
- Visualization suite
- Interactive cleaner

---

## License

Internal tool for DrukFarm plant disease detection system.

---

**Happy Curating! 🌿📊**
