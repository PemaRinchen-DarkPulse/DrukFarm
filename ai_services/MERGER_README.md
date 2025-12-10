# 🌾 Dataset Merger - README

## Overview

The **Dataset Merger** is a production-ready tool for integrating multiple plant disease classification datasets into a unified, high-quality dataset with proper structure, comprehensive metadata, and clean train/val/test/holdout splits.

## ✨ Key Features

- ✅ **Automatic Dataset Scanning** - Recursively finds all images across multiple datasets
- ✅ **Dual Deduplication** - MD5 (exact) + Perceptual hash (near-duplicates)
- ✅ **Quality-Based Selection** - Retains highest quality version when duplicates exist
- ✅ **Complete Provenance Tracking** - Full source information for every image
- ✅ **Similarity Clustering** - Groups related images to prevent data leakage
- ✅ **Stratified Splits** - Balanced train/val/test/holdout (70/15/15/10 default)
- ✅ **Dual Output Structure** - Organized folders + comprehensive CSV metadata
- ✅ **Rich Metadata** - Resolution, quality, hashes, EXIF, provenance
- ✅ **Comprehensive Reports** - Duplicates, clusters, splits, summary

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ai_services
drukFarmVenv\Scripts\activate
pip install numpy pandas pillow opencv-python scikit-learn imagehash
```

### 2. Run Interactive Merger

```bash
python run_merger.py
```

Follow the prompts to configure and run the merge.

### 3. Check Results

```bash
# View summary report
type myDatasets\merged_dataset\reports\merge_summary_report.txt

# Open metadata in Excel/Pandas
# myDatasets/merged_dataset/metadata/merged_metadata.csv
```

## 📖 Documentation

- **DATASET_MERGER_GUIDE.md** - Complete usage guide with examples
- **MERGER_WORKFLOW.md** - Visual pipeline diagrams and workflows
- **merger_examples.py** - Programmatic usage examples

## 🎯 Use Cases

### Use Case 1: First-Time Merge

You have 10 different plant disease datasets and want to create a unified dataset:

```bash
python dataset_merger.py --datasets-root myDatasets
```

**Result**: Merged dataset with deduplicated images, proper splits, full metadata.

### Use Case 2: Custom Split Ratios

You want more training data (80%) and less validation/test:

```bash
python dataset_merger.py --datasets-root myDatasets \
    --train-ratio 0.8 --val-ratio 0.1 --test-ratio 0.1
```

### Use Case 3: Programmatic Control

```python
from dataset_merger import DatasetMerger

merger = DatasetMerger('myDatasets', 'custom_output')
merger.scan_datasets()
merger.deduplicate_images()
merger.cluster_similar_images(similarity_threshold=4.0)
merger.create_stratified_splits(train_ratio=0.75)
merger.create_output_structure()
merger.generate_metadata_files()
merger.generate_summary_report()
```

## 📁 Output Structure

```
merged_dataset/
├── images/                          # Organized image files
│   ├── train/
│   │   ├── class_a/
│   │   │   ├── dataset1_img001.jpg
│   │   │   └── dataset2_img002.jpg
│   │   └── class_b/
│   ├── val/
│   ├── test/
│   └── holdout/
│
├── metadata/                        # CSV metadata files
│   ├── merged_metadata.csv          # Complete metadata (all images)
│   ├── provenance_map.csv           # Source tracking
│   ├── similarity_clusters.csv      # Cluster assignments
│   └── split_files_list.csv         # Train/val/test/holdout lists
│
└── reports/                         # Analysis reports
    ├── duplicates_report.csv        # Duplicate analysis
    └── merge_summary_report.txt     # Summary report
```

## 🔧 Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--datasets-root` | `myDatasets` | Source datasets folder |
| `--output-root` | `datasets_root/merged_dataset` | Output location |
| `--train-ratio` | `0.7` | Training set proportion (70%) |
| `--val-ratio` | `0.15` | Validation set proportion (15%) |
| `--test-ratio` | `0.15` | Test set proportion (15%) |
| `--holdout-ratio` | `0.10` | Hold-out set proportion (10%) |
| `--random-seed` | `42` | Random seed for reproducibility |

## 🧪 Quality Metrics

### Quality Score

Images are scored 0-100 based on sharpness (Laplacian variance):
- **High (>70)**: Sharp, clear images
- **Medium (30-70)**: Acceptable quality
- **Low (<30)**: Blurry or poor quality

When duplicates are found, the highest quality version is retained.

### Duplicate Detection

1. **Exact Duplicates (MD5)**: Bit-for-bit identical files
2. **Near Duplicates (pHash)**: Visually similar (Hamming distance < 5)

## 📊 Metadata Files

### merged_metadata.csv

Complete information for every image:
- `image_id`, `filename`, `original_path`
- `canonical_class`, `dataset_source`
- `width`, `height`, `resolution`, `format`
- `md5_hash`, `perceptual_hash`
- `quality_score`, `cluster_id`
- `split` (train/val/test/holdout)
- `provenance` (JSON), `is_duplicate`

### provenance_map.csv

Source tracking for each image:
- Original dataset
- Original path and filename
- Scan timestamp

### similarity_clusters.csv

Cluster assignments:
- Images grouped by visual similarity
- Prevents data leakage across splits

### split_files_list.csv

Train/val/test/holdout assignments:
- Ready for DataLoader
- Includes paths in merged structure

### duplicates_report.csv

Duplicate analysis:
- Primary vs duplicate comparison
- Quality scores
- Hash values

## 🎓 Best Practices

1. **Backup Original Data**: Merger creates copies, originals are untouched
2. **Check Available Space**: Need ~1.5× original dataset size
3. **Review Summary Report**: Validate class names and distributions
4. **Inspect Sample Images**: Verify correct labeling
5. **Keep Hold-out Untouched**: Only use for final evaluation

## 🔗 Integration

### With Dataset Curator

```bash
# First: Merge datasets
python dataset_merger.py --datasets-root myDatasets

# Then: Analyze merged dataset
python dataset_curator.py --dataset-path merged_dataset/images/train
```

### With Training Pipeline

```python
import pandas as pd

# Load split assignments
splits = pd.read_csv('merged_dataset/metadata/split_files_list.csv')

# Get training images
train_df = splits[splits['split'] == 'train']

# Use in your DataLoader
for idx, row in train_df.iterrows():
    image_path = row['merged_path']
    label = row['canonical_class']
    # ... load and train
```

## 🐛 Troubleshooting

### Issue: Out of Memory

**Solution**: Process smaller batches or increase RAM

### Issue: Class Names Not Recognized

**Solution**: Check directory structure, ensure images are in class folders

### Issue: Too Many Duplicates

**Solution**: Review quality threshold, manually inspect duplicate groups

### Issue: Unbalanced Splits

**Solution**: Some classes may be too small; consider combining rare classes

## 📈 Performance

Expected runtime (varies by hardware):

| Dataset Size | Runtime |
|-------------|---------|
| <10K images | 2-5 min |
| 10-50K images | 10-30 min |
| 50-100K images | 30-60 min |
| >100K images | 1-2 hours |

## 🤝 Contributing

Found a bug or have a suggestion? This tool is part of the DrukFarm plant disease classification project.

## 📝 License

Part of the DrukFarm project.

## 🙏 Acknowledgments

Built with:
- NumPy, Pandas - Data processing
- Pillow, OpenCV - Image handling
- Scikit-learn - Clustering
- ImageHash - Perceptual hashing

---

**Version**: 1.0  
**Last Updated**: December 10, 2025  
**Author**: Dataset Integration Engineer

For detailed documentation, see **DATASET_MERGER_GUIDE.md**
