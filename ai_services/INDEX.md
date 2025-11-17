# 🌿 AI Services for Plant Disease Dataset Management - START HERE

> **Comprehensive Plant Disease Dataset Analysis, Curation, Merging & Label Taxonomy Design**

---

## 🚀 Quick Start

### Step 1: Merge All Datasets (NEW! Recommended First Step)
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
pip install -r requirements.txt
python validate_merger.py
python dataset_merger.py
```
Wait ~10-40 minutes (depends on dataset size). Check `merged_output/` folder.

### Step 2: Analyze Datasets (30 seconds to start)
```cmd
python dataset_curator.py
python dataset_visualizer.py
```
Wait 10-30 minutes. Check `dataset_analysis_output/` folder.

### Step 3: Design Label Taxonomy (5 minutes to start)
```cmd
python label_taxonomy_designer.py
```
Wait 5-15 minutes. Check `taxonomy_output/` folder.

---

## 📚 Documentation Guide

**New to the system?** Read in this order:

### 🔄 Dataset Merger (NEW!)
1. **DATASET_MERGER_SUMMARY.md** ← **START HERE for merging!**
   - Executive overview
   - Quick 3-step guide
   - What you get
   
2. **DATASET_MERGER_QUICKSTART.md**
   - 5-minute setup
   - Basic usage
   - Configuration

3. **DATASET_MERGER_INDEX.md**
   - Complete navigation hub
   - All features indexed
   - Common tasks

4. **DATASET_MERGER_README.md**
   - Full documentation
   - Advanced features
   - Customization

5. **DATASET_MERGER_VISUAL.md**
   - Architecture diagrams
   - Visual workflows
   - System design

### Dataset Curation
1. **IMPLEMENTATION_SUMMARY.md** ← **Start here for dataset analysis!**
   - What was created
   - What you can do
   - Expected results
   
2. **QUICK_REFERENCE.md**
   - Common tasks
   - Cheat sheet format
   - Quick commands

3. **COMPLETE_GUIDE.md**
   - Full walkthrough
   - Detailed examples
   - Best practices

### Label Taxonomy Design
1. **TAXONOMY_IMPLEMENTATION_SUMMARY.md** ← **Start here for taxonomy!**
   - Taxonomy system overview
   - Hybrid strategy explained
   - Output files guide

2. **TAXONOMY_DESIGNER_GUIDE.md**
   - Complete usage guide
   - Configuration options
   - Integration workflows

3. **DATASET_CURATOR_README.md**
   - Technical reference
   - Advanced usage
   - API details

---

## 🎯 What This Does

### 🔄 Dataset Merger (NEW!)
Merges **all datasets** in `myDatasets/` into a unified, production-ready dataset:
- ✅ Removes duplicates (MD5 + perceptual hashing)
- ✅ Scores image quality (0-100)
- ✅ Tracks complete provenance
- ✅ Clusters similar images
- ✅ Creates stratified train/val/test/holdout splits
- ✅ Generates comprehensive reports

### 📊 Dataset Curator
Analyzes **11 plant disease datasets** (~50k images) and generates:

✅ **Manifests** - Complete image inventory (CSV)  
✅ **Statistics** - Class distribution, resolution, quality  
✅ **Duplicate Detection** - Exact (MD5) + Near (perceptual hash)  
✅ **Label Analysis** - Find naming conflicts  
✅ **Quality Assessment** - Blur, size, brightness issues  
✅ **Sample Export** - 20 images per class for review  
✅ **Visualizations** - Charts and graphs  
✅ **Health Report** - Comprehensive summary with recommendations  

---

## 📂 Files Overview

### 🔄 Dataset Merger (NEW!)
- `dataset_merger.py` - **Main merger implementation** ⭐
- `validate_merger.py` - Validation test suite
- `merger_config.json` - Configuration settings
- `requirements.txt` - Unified dependencies

### Python Scripts
- `dataset_curator.py` - **Core analysis engine** ⭐
- `dataset_visualizer.py` - Generate charts/graphs
- `dataset_cleaner.py` - Interactive data cleaning
- `label_taxonomy_designer.py` - Create canonical taxonomy
- `dataset_reorganizer.py` - Apply taxonomy to datasets

### Configuration
- `curator_config.json` - Customize settings
- `requirements.txt` - Unified dependencies

### 📚 Dataset Merger Documentation
- `DATASET_MERGER_SUMMARY.md` - **Start here!**
- `DATASET_MERGER_QUICKSTART.md` - 5-min guide
- `DATASET_MERGER_INDEX.md` - Navigation hub
- `DATASET_MERGER_README.md` - Full docs
- `DATASET_MERGER_VISUAL.md` - Diagrams

### 📚 Curator Documentation
- `IMPLEMENTATION_SUMMARY.md` - **Read first!**
- `QUICK_REFERENCE.md` - Task cheat sheet
- `COMPLETE_GUIDE.md` - Full walkthrough
- `DATASET_CURATOR_README.md` - Technical reference

### 📚 Taxonomy Documentation
- `TAXONOMY_IMPLEMENTATION_SUMMARY.md` - Overview
- `TAXONOMY_DESIGNER_GUIDE.md` - Complete guide

### Navigation
- `INDEX.md` - This file

---

## 💡 Common Tasks

### 🔄 Merge All Datasets (NEW!)
```cmd
cd ai_services
drukFarmVenv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Validate setup
python validate_merger.py

# Run merger
python dataset_merger.py

# Check results
cat merged_output\reports\MERGE_SUMMARY.md
```

### First Time Setup
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
pip install -r requirements.txt
```

### Run Analysis
```cmd
python dataset_curator.py
python dataset_visualizer.py
```

### Check Results
1. Open `dataset_analysis_output/reports/dataset_health_report.txt`
2. Browse `dataset_analysis_output/visualizations/`
3. Review `dataset_analysis_output/manual_inspection_samples/`

### Clean Dataset
```cmd
python dataset_cleaner.py
```
(Interactive - follow prompts)

---

## 📊 Output Structure

```
dataset_analysis_output/
├── manifests/           # CSV inventory
├── statistics/          # Metrics & conflicts
├── duplicates/          # Duplicate lists
├── manual_inspection_samples/  # 20 per class
├── visualizations/      # Charts & graphs
└── reports/            # Health report
```

---

## ⚙️ System Requirements

- ✅ Python 3.8+ (installed in `drukFarmVenv`)
- ✅ Windows OS
- ✅ 10+ GB free disk space
- ✅ 4+ GB RAM recommended

---

## 🔧 Dependencies

Automatically installed via `requirements.txt`:
- pandas, numpy - Data processing
- opencv-python, Pillow - Image analysis
- ImageHash - Duplicate detection
- scikit-learn - Machine learning
- matplotlib, seaborn - Visualizations
- tqdm - Progress bars

---

## ⏱️ Expected Runtime

| Dataset Size | Duration |
|--------------|----------|
| < 10k images | ~5 min   |
| 10-50k images | ~15 min |
| 50k+ images  | ~30 min  |

---

## 📖 Learning Path

**Beginner:**
1. Run `python dataset_curator.py` then `python dataset_visualizer.py`
2. Read `IMPLEMENTATION_SUMMARY.md`
3. Check output visualizations

**Intermediate:**
1. Review `QUICK_REFERENCE.md`
2. Customize `curator_config.json`
3. Run `dataset_cleaner.py`

**Advanced:**
1. Study `COMPLETE_GUIDE.md`
2. Modify `dataset_curator.py`
3. Extend analysis features

---

## 🎯 Typical Workflow

```
Day 1: Run Analysis

└── Review health report

Day 2: Review Results
├── Check visualizations
├── Review duplicates
└── Inspect samples

Day 3: Clean Data
├── python dataset_cleaner.py
├── Remove duplicates
└── Fix quality issues

Day 4: Standardize
├── Create label mapping
├── Rename classes
└── Re-run analysis

Day 5: Final Dataset
└── Ready for model training!
```

---

## 🆘 Help

**Error: Missing module**
```cmd
pip install [module-name]
```

**Too slow?**
Edit `curator_config.json`:
```json
{
  "enable_perceptual_hashing": false,
  "max_quality_check_images": 500
}
```

**Need details?**
- Check `IMPLEMENTATION_SUMMARY.md`
- Review `COMPLETE_GUIDE.md` troubleshooting section

---

## ✅ Checklist

Before running:
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] 10+ GB free space
- [ ] Original datasets backed up elsewhere

After running:
- [ ] Health report reviewed
- [ ] Visualizations checked
- [ ] Duplicates identified
- [ ] Samples inspected
- [ ] Cleaning plan created

---

## 🎉 You're Ready!

**Everything is set up and documented.**

Start with:
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python dataset_curator.py
python dataset_visualizer.py
```

Then read: `IMPLEMENTATION_SUMMARY.md`

---

## 📞 Quick Reference Links

- **What was created?** → `IMPLEMENTATION_SUMMARY.md`
- **How do I...?** → `QUICK_REFERENCE.md`
- **Full guide** → `COMPLETE_GUIDE.md`
- **Technical docs** → `DATASET_CURATOR_README.md`
- **Start here** → `INDEX.md` (this file)

---

*Dataset Curation System v1.0*  
*For DrukFarm Plant Disease Detection*  
*Created: 2025-11-15*

**Ready to analyze your datasets! 🚀**
