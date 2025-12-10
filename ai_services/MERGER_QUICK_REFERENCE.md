# Dataset Merger - Quick Reference Cheat Sheet

## 🚀 Quick Commands

```bash
# Interactive merge (recommended for beginners)
python run_merger.py

# Basic merge with defaults
python dataset_merger.py --datasets-root myDatasets

# Custom split ratios
python dataset_merger.py --datasets-root myDatasets \
    --train-ratio 0.8 --val-ratio 0.1 --test-ratio 0.1

# Specify output location
python dataset_merger.py --datasets-root myDatasets \
    --output-root custom_output

# Full custom configuration
python dataset_merger.py \
    --datasets-root myDatasets \
    --output-root merged_custom \
    --train-ratio 0.75 \
    --val-ratio 0.15 \
    --test-ratio 0.10 \
    --holdout-ratio 0.10 \
    --random-seed 42
```

---

## 📁 Output Files Quick Reference

### Essential Files

| File | Location | Purpose |
|------|----------|---------|
| **Summary Report** | `reports/merge_summary_report.txt` | Human-readable overview |
| **Main Metadata** | `metadata/merged_metadata.csv` | Complete image metadata |
| **Split Lists** | `metadata/split_files_list.csv` | Train/val/test assignments |
| **Duplicates** | `reports/duplicates_report.csv` | Duplicate analysis |
| **Provenance** | `metadata/provenance_map.csv` | Source tracking |
| **Clusters** | `metadata/similarity_clusters.csv` | Similarity groups |

### Folder Structure

```
merged_dataset/
├── images/
│   ├── train/
│   ├── val/
│   ├── test/
│   └── holdout/
├── metadata/
│   └── *.csv
└── reports/
    └── *.txt, *.csv
```

---

## 🔍 Common Tasks

### Check Merge Results
```bash
# View summary
type merged_dataset\reports\merge_summary_report.txt

# Count images per split
dir merged_dataset\images\train /s /b | find /c ".jpg"
dir merged_dataset\images\val /s /b | find /c ".jpg"
dir merged_dataset\images\test /s /b | find /c ".jpg"
```

### Analyze with Python
```python
import pandas as pd

# Load metadata
df = pd.read_csv('merged_dataset/metadata/merged_metadata.csv')

# Get unique images only
unique = df[df['is_duplicate'] == False]

# Check split distribution
print(unique['split'].value_counts())

# Check class distribution
print(unique['canonical_class'].value_counts())

# Find low quality images
low_quality = unique[unique['quality_score'] < 30]
print(f"Low quality images: {len(low_quality)}")
```

### Filter by Quality
```python
# Load split list
splits = pd.read_csv('merged_dataset/metadata/split_files_list.csv')

# Merge with metadata for quality scores
meta = pd.read_csv('merged_dataset/metadata/merged_metadata.csv')
meta = meta[meta['is_duplicate'] == False]
splits = splits.merge(meta[['image_id', 'quality_score']], on='image_id')

# Filter high quality only
high_quality = splits[splits['quality_score'] >= 50]
high_quality.to_csv('high_quality_images.csv', index=False)
```

### Export Specific Classes
```python
# Load split list
df = pd.read_csv('merged_dataset/metadata/split_files_list.csv')

# Filter classes
target_classes = ['healthy', 'early blight', 'late blight']
subset = df[df['canonical_class'].isin(target_classes)]

# Save
subset.to_csv('class_subset.csv', index=False)
```

---

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError"
```bash
# Activate environment
drukFarmVenv\Scripts\activate

# Install dependencies
pip install numpy pandas pillow opencv-python scikit-learn imagehash
```

### Issue: "Folder not found"
```bash
# Check current directory
cd

# Navigate to ai_services
cd c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services

# Check myDatasets exists
dir myDatasets
```

### Issue: "Out of memory"
- Close other applications
- Process smaller batches manually
- Increase virtual memory
- Use a machine with more RAM

### Issue: "Permission denied"
- Run as administrator
- Check folder permissions
- Close files if open in Excel

---

## ⚙️ Configuration Quick Reference

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `train_ratio` | 0.7 | 0.0-1.0 | Training set proportion |
| `val_ratio` | 0.15 | 0.0-1.0 | Validation set proportion |
| `test_ratio` | 0.15 | 0.0-1.0 | Test set proportion |
| `holdout_ratio` | 0.10 | 0.0-1.0 | Hold-out set proportion |
| `random_seed` | 42 | Any int | Reproducibility seed |
| `similarity_threshold` | 5.0 | 0.0-20.0 | Clustering threshold |

**Note**: Ratios should sum to ≤ 1.0 after accounting for holdout.

---

## 📊 Metadata Columns Quick Reference

### merged_metadata.csv
- `image_id` - Unique identifier
- `filename` - Original filename
- `canonical_class` - Normalized class label
- `dataset_source` - Source dataset name
- `width`, `height` - Image dimensions
- `quality_score` - Quality (0-100)
- `is_duplicate` - Boolean flag
- `split` - train/val/test/holdout
- `md5_hash` - Exact duplicate detection
- `perceptual_hash` - Near-duplicate detection
- `provenance` - JSON source tracking

### split_files_list.csv
- `image_id` - Image identifier
- `filename` - Image filename
- `canonical_class` - Class label
- `split` - Split assignment
- `merged_path` - Path in merged dataset
- `dataset_source` - Original dataset

---

## 🎯 Workflow Quick Guide

```
1. Prepare datasets in myDatasets/
   └─ Each dataset in separate folder

2. Run merger
   └─ python run_merger.py

3. Review summary report
   └─ reports/merge_summary_report.txt

4. Check metadata
   └─ metadata/merged_metadata.csv

5. Validate splits
   └─ metadata/split_files_list.csv

6. Use in training
   └─ Load split_files_list.csv in DataLoader
```

---

## 💡 Pro Tips

1. **Always backup originals** - Merger creates copies, but be safe
2. **Check disk space** - Need ~1.5× original dataset size
3. **Review class names** - Check summary report for unexpected classes
4. **Validate a sample** - Manually inspect 10-20 images per class
5. **Keep holdout untouched** - Only use for final evaluation
6. **Use same random seed** - Ensures reproducible splits
7. **Check quality distribution** - Filter low quality if needed
8. **Review duplicates** - Verify selections make sense

---

## 🔗 Related Commands

```bash
# After merging, analyze with curator
python dataset_curator.py --dataset-path merged_dataset/images/train

# Design taxonomy
python label_taxonomy_designer.py --dataset-path merged_dataset

# Generate visualizations
python dataset_visualizer.py

# Run examples
python merger_examples.py
```

---

## 📚 Documentation Quick Links

- **Complete Guide**: DATASET_MERGER_GUIDE.md
- **Visual Workflow**: MERGER_WORKFLOW.md
- **Implementation Summary**: MERGER_IMPLEMENTATION_SUMMARY.md
- **README**: MERGER_README.md
- **Examples**: merger_examples.py

---

## ⏱️ Performance Benchmarks

| Dataset Size | Scan | Dedupe | Cluster | Copy | Total |
|-------------|------|--------|---------|------|-------|
| 10K images | 2 min | 3 min | 2 min | 3 min | ~10 min |
| 50K images | 8 min | 12 min | 8 min | 12 min | ~40 min |
| 100K images | 15 min | 25 min | 15 min | 25 min | ~80 min |

*Actual times vary by hardware and image sizes*

---

**Last Updated**: December 10, 2025  
**Version**: 1.0
