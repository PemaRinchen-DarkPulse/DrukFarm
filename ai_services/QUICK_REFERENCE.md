# Dataset Curator - Quick Reference Guide

## 🚀 Quick Start

### Full Analysis (Recommended)
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
python dataset_visualizer.py
```
This runs everything: curation + visualization.

### Analysis Only
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
```

### Alternative: Manual Execution
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
python dataset_visualizer.py
```

---

## 📁 What Gets Generated

### Critical Files to Review First
1. **`reports/dataset_health_report.txt`** - Start here! Overall summary
2. **`visualizations/`** - Visual insights at a glance
3. **`statistics/label_conflicts.csv`** - Label naming issues
4. **`duplicates/exact_duplicates_md5.csv`** - Images to potentially remove

### All Output Files

#### Manifests (dataset_analysis_output/manifests/)
- `master_manifest.csv` - All datasets overview
- `[Dataset Name]_images.csv` - Per-dataset image inventory

#### Statistics (dataset_analysis_output/statistics/)
- `class_distribution.csv` - How many images per class
- `resolution_statistics.csv` - Image size ranges per dataset
- `color_mode_distribution.csv` - RGB/Grayscale breakdown
- `label_conflicts.csv` - Inconsistent class names
- `label_mapping.csv` - All labels normalized
- `quality_issues.csv` - Problems found (blur, size, etc.)

#### Duplicates (dataset_analysis_output/duplicates/)
- `exact_duplicates_md5.csv` - Byte-identical images
- `near_duplicates_phash.csv` - Visually similar images

#### Samples (dataset_analysis_output/manual_inspection_samples/)
- Folders per class with 20 sample images each
- Use for manual quality verification

#### Visualizations (dataset_analysis_output/visualizations/)
- `dataset_sizes.png` - Bar chart of dataset sizes
- `class_distribution_top30.png` - Most common classes
- `resolution_distribution.png` - Image dimension ranges
- `quality_issues.png` - Issue type breakdown
- `class_dataset_overlap.png` - Which classes in which datasets
- `summary_statistics.json` - Machine-readable stats

---

## 🔍 Common Tasks

### Find All Images of a Specific Disease
1. Open `statistics/class_distribution.csv`
2. Search for disease name
3. Check "Datasets" column to see sources
4. Open relevant `manifests/[Dataset]_images.csv` for paths

### Identify Duplicate Images to Remove
1. Open `duplicates/exact_duplicates_md5.csv`
2. Group by "Duplicate Group" column
3. Keep one image per group, delete others
4. Check "Size (KB)" - keep highest quality version

### Fix Label Inconsistencies
1. Open `statistics/label_conflicts.csv`
2. Review "Label Variants" column
3. Create mapping (e.g., all "blight" variants → "blight")
4. Update dataset folders accordingly

### Check Image Quality Issues
1. Open `statistics/quality_issues.csv`
2. Filter by "Issue Type"
3. Review flagged images in "Path" column
4. Delete/fix problematic images

### Sample Class for Model Testing
1. Go to `manual_inspection_samples/[class_name]/`
2. Grab 20 pre-selected representative images
3. Use for validation or presentation

---

## ⚙️ Configuration

Edit `curator_config.json` to customize:

```json
{
  "analysis_settings": {
    "samples_per_class": 20,  // Change sample count
    "max_quality_check_images": 1000,  // Check more/fewer images
    "enable_perceptual_hashing": true  // Set false for speed
  },
  
  "quality_thresholds": {
    "min_width": 50,  // Adjust minimum size
    "blur_threshold": 100  // Blur sensitivity
  }
}
```

---

## 📊 Understanding the Numbers

### Class Distribution
- **Imbalanced?** Classes with <100 images may need augmentation
- **Over-represented?** Classes with >10k may dominate training

### Resolution Statistics
- **Median Resolution**: Target size for preprocessing
- **Min/Max Range**: If >10x difference, standardize needed

### Quality Issues
- **Too Dark/Bright**: Adjust exposure in preprocessing
- **Blurry**: Consider sharpening filters or removal
- **Too Small**: May need upscaling (with caution)

### Duplicates
- **Exact (MD5)**: Safe to remove - identical files
- **Near (pHash)**: Review manually - may be augmentations

---

## 🐛 Troubleshooting

### "No module named 'cv2'"
```cmd
pip install opencv-python
```

### "Permission denied" when copying samples
- Close any open files in output folder
- Run command prompt as Administrator

### Analysis takes too long
- Edit `dataset_curator.py`, line ~390
- Change `self.all_images[:1000]` to smaller number
- Or disable: `enable_quality_assessment": false` in config

### Out of memory
- Process datasets one at a time
- Reduce `max_quality_check_images` in config
- Close other applications

---

## 📈 Next Steps After Analysis

1. **Review Health Report** - Read recommendations
2. **Clean Duplicates** - Remove exact duplicates
3. **Standardize Labels** - Fix naming conflicts
4. **Address Quality Issues** - Delete/fix flagged images
5. **Balance Classes** - Plan augmentation for small classes
6. **Normalize Resolutions** - Decide target size
7. **Create Train/Val/Test Splits** - Stratified by class
8. **Document Decisions** - Keep record of changes made

---

## 💡 Pro Tips

- Run analysis BEFORE making any changes to datasets
- Keep original datasets untouched - work on copies
- Document all data cleaning decisions
- Re-run analysis after major changes to verify
- Use samples folder to create presentation slides
- Export statistics to Excel for stakeholder reports

---

## 📞 Support

For issues or questions, check:
1. `DATASET_CURATOR_README.md` - Detailed documentation
2. `dataset_health_report.txt` - Automated recommendations
3. Python error messages - Usually indicate missing dependencies

---

**Last Updated**: 2025-11-15
**Version**: 1.0
