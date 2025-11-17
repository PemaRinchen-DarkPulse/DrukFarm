# 🚀 Dataset Merger - Quick Start Guide

## Installation

1. **Install dependencies**:
```bash
cd ai_services
pip install -r requirements.txt
```

2. **Verify datasets** are in `myDatasets/` folder

## Run the Merger

```bash
python dataset_merger.py
```

## What Happens

1. ✅ Scans all datasets
2. ✅ Analyzes images (resolution, quality, hashing)
3. ✅ Removes duplicates (MD5 + perceptual)
4. ✅ Clusters similar images
5. ✅ Creates train/val/test/holdout splits
6. ✅ Organizes merged dataset
7. ✅ Generates reports

## Output

Find results in `merged_output/`:
- `merged_dataset/` - Organized images
- `reports/` - CSV files and summary

## Key Reports

| File | Purpose |
|------|---------|
| `MERGE_SUMMARY.md` | Overview and statistics |
| `merged_metadata.csv` | Complete image metadata |
| `duplicates_report.csv` | Removed duplicates |
| `split_files_list.csv` | Train/val/test assignments |

## Next Steps

1. Review `reports/MERGE_SUMMARY.md`
2. Check class distributions
3. Verify holdout set diversity
4. Start training with `merged_dataset/train/`
5. Validate with `merged_dataset/val/`
6. Test with `merged_dataset/test/`
7. **Save holdout for final evaluation only!**

## Configuration

Edit `dataset_merger.py` main():

```python
# Change paths
DATASETS_ROOT = r"your/datasets/path"
OUTPUT_ROOT = r"your/output/path"

# Adjust ratios in DatasetSplitter:
train_ratio=0.7    # 70%
val_ratio=0.15     # 15%
test_ratio=0.15    # 15%
holdout_ratio=0.1  # 10%
```

## Troubleshooting

**Slow performance?** 
- Process fewer datasets at once
- Use SSD storage

**Too many duplicates?**
- Increase `perceptual_threshold` in DeduplicationEngine

**Imbalanced splits?**
- Check original class distribution
- Adjust split ratios

## Questions?

See full documentation: `DATASET_MERGER_README.md`
