# 🌿 DrukFarm AI Services - Dataset Management Suite

> **Complete toolkit for managing, merging, analyzing, and preparing plant disease datasets for deep learning**

---

## 🎯 What You Get

A production-ready suite of tools for dataset management:

1. **🔄 Dataset Merger** - Merge multiple datasets with deduplication
2. **📊 Dataset Curator** - Analyze dataset quality and characteristics  
3. **🏷️ Taxonomy Designer** - Create standardized label systems
4. **📈 Dataset Visualizer** - Generate insights and visualizations
5. **🧹 Dataset Cleaner** - Interactive data cleaning

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Activate environment
cd ai_services
drukFarmVenv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Merge all datasets
python dataset_merger.py
```

**Done!** Your merged dataset is in `merged_output/`

---

## 📚 What's Inside

```
ai_services/
│
├── 🔄 DATASET MERGER (NEW!)
│   ├── dataset_merger.py              # Main merger
│   ├── validate_merger.py             # Validation suite
│   ├── merger_config.json             # Configuration
│   └── requirements.txt               # Dependencies
│
├── 📊 DATASET CURATOR
│   ├── dataset_curator.py             # Analysis engine
│   ├── dataset_visualizer.py          # Visualizations
│   ├── dataset_cleaner.py             # Interactive cleaning
│   ├── curator_config.json            # Configuration
│   └── (uses requirements.txt)        # Dependencies
│
├── 🏷️ TAXONOMY DESIGNER
│   ├── label_taxonomy_designer.py     # Taxonomy creation
│   └── dataset_reorganizer.py         # Apply taxonomy
│
├── 📁 DATA
│   ├── myDatasets/                    # Input datasets
│   ├── merged_output/                 # Merger output
│   ├── dataset_analysis_output/       # Curator output
│   └── taxonomy_output/               # Taxonomy output
│
└── 📖 DOCUMENTATION
    ├── DATASET_MERGER_SUMMARY.md      # Merger overview ⭐
    ├── DATASET_MERGER_README.md       # Merger full docs
    ├── DATASET_MERGER_INDEX.md        # Merger navigation
    ├── IMPLEMENTATION_SUMMARY.md      # Curator overview ⭐
    ├── TAXONOMY_IMPLEMENTATION_SUMMARY.md  # Taxonomy overview ⭐
    ├── COMPLETE_WORKFLOW.md           # End-to-end guide ⭐
    └── INDEX.md                       # Main navigation ⭐
```

---

## 🚀 Recommended Workflow

### Step 1: Merge Datasets (Start Here!)

**What it does**: Combines all datasets, removes duplicates, creates splits

```bash
pip install -r requirements.txt
python validate_merger.py
python dataset_merger.py
```

**Output**: 
- Unified dataset in `merged_output/merged_dataset/`
- Splits: train (70%), val (15%), test (15%), holdout (10%)
- Reports in `merged_output/reports/`

**Documentation**: `DATASET_MERGER_SUMMARY.md`

---

### Step 2: Analyze Quality (Recommended)

**What it does**: Analyzes merged dataset for quality and characteristics

```bash
pip install -r requirements.txt
python dataset_curator.py
python dataset_visualizer.py
```

**Output**:
- Statistics and quality reports
- Visualizations and charts
- Sample images for review

**Documentation**: `IMPLEMENTATION_SUMMARY.md`

---

### Step 3: Design Taxonomy (Optional)

**What it does**: Creates standardized label system

```bash
python label_taxonomy_designer.py
```

**Output**:
- Canonical label taxonomy
- Label mapping rules
- Migration plan

**Documentation**: `TAXONOMY_IMPLEMENTATION_SUMMARY.md`

---

### Step 4: Train Your Model

Use the merged dataset:

```python
from torch.utils.data import DataLoader
from torchvision import transforms

# Your training code here
train_dir = 'merged_output/merged_dataset/train/'
val_dir = 'merged_output/merged_dataset/val/'
test_dir = 'merged_output/merged_dataset/test/'
holdout_dir = 'merged_output/merged_dataset/holdout/'
```

---

## 🎓 Documentation Guide

**New to the system?** Read these in order:

### 🔄 Start with Merger
1. **DATASET_MERGER_SUMMARY.md** - 5-minute overview
2. **DATASET_MERGER_QUICKSTART.md** - Quick setup
3. **DATASET_MERGER_README.md** - Full documentation

### 📊 Then Analyze
1. **IMPLEMENTATION_SUMMARY.md** - Curator overview
2. **QUICK_REFERENCE.md** - Common tasks
3. **COMPLETE_GUIDE.md** - Full walkthrough

### 🏷️ Design Taxonomy
1. **TAXONOMY_IMPLEMENTATION_SUMMARY.md** - Taxonomy overview
2. **TAXONOMY_DESIGNER_GUIDE.md** - Complete guide

### 🎯 See Complete Picture
1. **COMPLETE_WORKFLOW.md** - End-to-end workflow
2. **INDEX.md** - Master navigation

---

## 📊 Features Comparison

| Feature | Merger | Curator | Taxonomy |
|---------|--------|---------|----------|
| **Combine datasets** | ✅ | ❌ | ❌ |
| **Remove duplicates** | ✅ | ⚠️ Detect only | ❌ |
| **Quality scoring** | ✅ | ✅ | ❌ |
| **Create splits** | ✅ | ❌ | ❌ |
| **Provenance tracking** | ✅ | ❌ | ❌ |
| **Statistics** | ⚠️ Basic | ✅ Detailed | ❌ |
| **Visualizations** | ❌ | ✅ | ⚠️ Basic |
| **Label standardization** | ❌ | ❌ | ✅ |
| **Interactive cleaning** | ❌ | ✅ | ❌ |

**Recommended**: Use all three for best results!

---

## ⚙️ System Requirements

### Required
- Python 3.8+
- Windows/Linux/Mac
- 8GB RAM (minimum)
- 10GB free disk space

### Python Packages
```bash
# Merger
numpy, pandas, pillow, opencv-python, scikit-learn, imagehash

# Curator  
numpy, pandas, pillow, matplotlib, seaborn

# All included in requirements_*.txt files
```

---

## 📈 Performance

Expected processing times:

| Dataset Size | Merge | Analyze | Taxonomy | Total |
|--------------|-------|---------|----------|-------|
| 1K images | 1 min | 2 min | 1 min | ~5 min |
| 10K images | 8 min | 15 min | 5 min | ~30 min |
| 50K images | 40 min | 60 min | 15 min | ~2 hrs |

*Intel i7, 16GB RAM, SSD*

---

## 🎯 Key Features

### Dataset Merger
- ✅ MD5 + perceptual hashing deduplication
- ✅ Quality scoring (0-100)
- ✅ Complete provenance tracking
- ✅ Similarity clustering
- ✅ Stratified splits with holdout
- ✅ Organized directory structure
- ✅ Comprehensive CSV reports

### Dataset Curator
- ✅ Manifest generation
- ✅ Statistical analysis
- ✅ Duplicate detection
- ✅ Label analysis
- ✅ Quality assessment
- ✅ Sample extraction
- ✅ Visualizations
- ✅ Health reports

### Taxonomy Designer
- ✅ Synonym detection
- ✅ Canonical naming
- ✅ Mapping rules
- ✅ Migration planning
- ✅ Visualization
- ✅ Export formats

---

## 🐛 Troubleshooting

### Installation Issues
```bash
# Try upgrading pip
python -m pip install --upgrade pip

# Install packages individually
pip install numpy pandas pillow opencv-python scikit-learn imagehash
```

### Memory Issues
- Process fewer images at once
- Reduce image resolution
- Use 64-bit Python
- Add more RAM

### Slow Performance
- Use SSD storage
- Close other programs
- Process datasets individually
- Skip perceptual hashing

### See Full Troubleshooting
- Merger: `DATASET_MERGER_README.md` → Troubleshooting section
- Curator: `COMPLETE_GUIDE.md` → Troubleshooting section

---

## 📖 Example Usage

### Example 1: Quick Merge
```bash
python dataset_merger.py
cat merged_output\reports\MERGE_SUMMARY.md
```

### Example 2: Full Pipeline
```bash
# Merge
python dataset_merger.py

# Analyze
python dataset_curator.py
python dataset_visualizer.py

# Taxonomy
python label_taxonomy_designer.py
```

### Example 3: Load in PyTorch
```python
import pandas as pd
from torch.utils.data import Dataset, DataLoader
from PIL import Image

class MergedDataset(Dataset):
    def __init__(self, split='train'):
        splits = pd.read_csv('merged_output/reports/split_files_list.csv')
        self.data = splits[splits['split'] == split]
        self.classes = sorted(self.data['canonical_class'].unique())
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        image = Image.open(row['image_path']).convert('RGB')
        label = self.class_to_idx[row['canonical_class']]
        return image, label

# Use it
train_dataset = MergedDataset('train')
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
```

---

## 🔍 What Gets Generated

### After Merger
```
merged_output/
├── merged_dataset/
│   ├── train/           # Training images
│   ├── val/             # Validation images
│   ├── test/            # Test images
│   └── holdout/         # Final evaluation images
└── reports/
    ├── merged_metadata.csv        # All metadata
    ├── provenance_map.csv         # Provenance tracking
    ├── duplicates_report.csv      # Removed duplicates
    ├── similarity_clusters.csv    # Image clusters
    ├── split_files_list.csv       # Split assignments
    └── MERGE_SUMMARY.md           # Summary report
```

### After Curator
```
dataset_analysis_output/
├── manifests/
├── statistics/
├── duplicates/
├── labels/
├── quality/
├── samples/
├── visualizations/
└── health_report.md
```

### After Taxonomy
```
taxonomy_output/
├── canonical_taxonomy.json
├── label_mappings.csv
├── taxonomy_visualization.html
└── migration_plan.md
```

---

## 🎓 Best Practices

1. **Always backup** original datasets
2. **Run validation** before full merge
3. **Review reports** after processing
4. **Keep holdout** untouched until final evaluation
5. **Document** your configuration
6. **Version control** your configs and scripts

---

## 📞 Getting Help

### Quick Help
1. Check documentation in this folder
2. Run validation: `python validate_merger.py`
3. Review generated reports

### Documentation Index
- **Navigation**: `INDEX.md`
- **Workflow**: `COMPLETE_WORKFLOW.md`
- **Merger**: `DATASET_MERGER_SUMMARY.md`
- **Curator**: `IMPLEMENTATION_SUMMARY.md`
- **Taxonomy**: `TAXONOMY_IMPLEMENTATION_SUMMARY.md`

---

## 📜 Version History

**Version 2.0.0** (November 2025)
- ✨ Added Dataset Merger
- ✨ Comprehensive documentation
- ✨ Validation suite
- ✨ Complete workflow guide

**Version 1.0.0** (Previous)
- Dataset Curator
- Taxonomy Designer
- Basic documentation

---

## 🎯 Next Steps

1. **Review** this README
2. **Read** `COMPLETE_WORKFLOW.md` for full workflow
3. **Install** dependencies: `pip install -r requirements.txt`
4. **Validate** setup: `python validate_merger.py`
5. **Run** merger: `python dataset_merger.py`
6. **Check** results: `cat merged_output\reports\MERGE_SUMMARY.md`
7. **Analyze** (optional): `python dataset_curator.py`
8. **Train** your model!

---

## 📄 License

Part of the DrukFarm project

---

## 🙏 Acknowledgments

Tools created for the DrukFarm agricultural AI platform, designed to help farmers identify plant diseases through mobile applications.

---

**Ready to get started?**

```bash
cd ai_services
drukFarmVenv\Scripts\activate
pip install -r requirements.txt
python dataset_merger.py
```

**Happy dataset merging! 🌿**
