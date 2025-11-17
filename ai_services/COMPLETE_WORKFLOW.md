# 🌿 Complete AI Services Workflow

## Recommended Workflow: From Raw Datasets to Production

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: DATASET MERGING (NEW! - Start Here)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Input: myDatasets/ (multiple datasets)
         ↓
    🔄 MERGE & DEDUPLICATE
         ↓
📦 Output: merged_output/
         - merged_dataset/ (organized by split)
         - reports/ (6 CSV files + summary)
         
Duration: ~10-40 minutes
Result: Unified, deduplicated dataset ready for training


PHASE 2: DATASET ANALYSIS (Optional but Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Input: merged_output/merged_dataset/ OR myDatasets/
         ↓
    📊 ANALYZE & VISUALIZE
         ↓
📈 Output: dataset_analysis_output/
         - Manifests
         - Statistics
         - Duplicate reports
         - Quality assessments
         - Visualizations
         
Duration: ~10-30 minutes
Result: Understand dataset quality & distribution


PHASE 3: TAXONOMY DESIGN (Recommended for Production)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Input: Analysis results
         ↓
    🏷️ DESIGN TAXONOMY
         ↓
📋 Output: taxonomy_output/
         - Canonical labels
         - Mapping rules
         - Migration plan
         
Duration: ~5-15 minutes
Result: Standardized label taxonomy


PHASE 4: MODEL TRAINING (Your Next Step)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Input: merged_dataset/train/ & merged_dataset/val/
         ↓
    🤖 TRAIN MODEL
         ↓
💾 Output: Trained model
         
Your responsibility!


PHASE 5: EVALUATION (Final Step)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Input: merged_dataset/test/ → merged_dataset/holdout/
         ↓
    📈 EVALUATE MODEL
         ↓
✅ Output: Performance metrics
         
Test on test set, final eval on holdout set!
```

## Detailed Phase Breakdown

### PHASE 1: Dataset Merger (Required)

**Purpose**: Create a unified, high-quality dataset

**Input**:
```
myDatasets/
├── BPLD Dataset/
├── Rice Dataset/
├── Okra DiseaseNet Dataset/
└── ... (all your datasets)
```

**Process**:
1. Scan all datasets
2. Extract metadata
3. Detect & remove duplicates
4. Cluster similar images
5. Create stratified splits
6. Organize files
7. Generate reports

**Output**:
```
merged_output/
├── merged_dataset/
│   ├── train/       (70%)
│   ├── val/         (15%)
│   ├── test/        (15%)
│   └── holdout/     (10%)
└── reports/
    ├── merged_metadata.csv
    ├── provenance_map.csv
    ├── duplicates_report.csv
    ├── similarity_clusters.csv
    ├── split_files_list.csv
    └── MERGE_SUMMARY.md
```

**Commands**:
```bash
pip install -r requirements.txt
python validate_merger.py
python dataset_merger.py
```

**When to Use**: 
- ✅ Always (recommended first step)
- ✅ Before training any model
- ✅ When combining multiple datasets

---

### PHASE 2: Dataset Analysis (Optional)

**Purpose**: Understand dataset quality and characteristics

**Input**:
```
merged_output/merged_dataset/  OR  myDatasets/
```

**Process**:
1. Generate manifests
2. Compute statistics
3. Detect duplicates (if not already merged)
4. Analyze labels
5. Assess quality
6. Export samples
7. Create visualizations

**Output**:
```
dataset_analysis_output/
├── manifests/
├── statistics/
├── duplicates/
├── labels/
├── quality/
├── samples/
└── visualizations/
```

**Commands**:
```bash
python dataset_curator.py
python dataset_visualizer.py
```

**When to Use**:
- ✅ After merging, to understand your data
- ✅ Before training, to identify issues
- ✅ For quality reports

---

### PHASE 3: Taxonomy Design (Recommended)

**Purpose**: Create standardized label taxonomy

**Input**:
```
dataset_analysis_output/labels/
OR manual class list
```

**Process**:
1. Collect all labels
2. Detect synonyms
3. Create canonical names
4. Generate mapping rules
5. Export taxonomy

**Output**:
```
taxonomy_output/
├── canonical_taxonomy.json
├── label_mappings.csv
├── taxonomy_visualization.html
└── migration_plan.md
```

**Commands**:
```bash
python label_taxonomy_designer.py
```

**When to Use**:
- ✅ When label inconsistencies exist
- ✅ For production systems
- ✅ Multi-dataset projects

---

## Quick Decision Tree

```
Do you have multiple datasets?
    │
    ├─ YES → Run Dataset Merger (Phase 1)
    │           ↓
    │        Want detailed analysis?
    │           ├─ YES → Run Curator (Phase 2)
    │           └─ NO  → Skip to training
    │
    └─ NO  → Single dataset
                ↓
             Want analysis?
                ├─ YES → Run Curator (Phase 2)
                └─ NO  → Ready to train

Are your labels inconsistent?
    │
    ├─ YES → Run Taxonomy Designer (Phase 3)
    └─ NO  → Ready to train
```

## Typical Workflows

### Workflow A: Quick Start (Minimal)
```bash
# Merge datasets
pip install -r requirements.txt
python dataset_merger.py

# Start training (your code)
# Use: merged_output/merged_dataset/train/
```

**Time**: ~30 minutes total  
**Use Case**: Fast prototyping

---

### Workflow B: Production (Recommended)
```bash
# 1. Merge datasets
pip install -r requirements.txt
python validate_merger.py
python dataset_merger.py

# 2. Analyze merged dataset
python dataset_curator.py
python dataset_visualizer.py

# 3. Design taxonomy (if needed)
python label_taxonomy_designer.py

# 4. Review all outputs
cat merged_output/reports/MERGE_SUMMARY.md
cat dataset_analysis_output/health_report.md

# 5. Start training (your code)
```

**Time**: ~1-2 hours total  
**Use Case**: Production systems, research

---

### Workflow C: Research & Documentation
```bash
# Full pipeline + documentation
pip install -r requirements.txt

# Merge
python validate_merger.py
python dataset_merger.py

# Analyze
python dataset_curator.py
python dataset_visualizer.py

# Taxonomy
python label_taxonomy_designer.py

# Clean (interactive)
python dataset_cleaner.py

# Review all documentation
cat DATASET_MERGER_SUMMARY.md
cat IMPLEMENTATION_SUMMARY.md
cat TAXONOMY_IMPLEMENTATION_SUMMARY.md
```

**Time**: ~2-3 hours total  
**Use Case**: Academic research, publications

---

## Integration Points

### Using Merged Dataset in PyTorch

```python
import pandas as pd
from torch.utils.data import Dataset
from PIL import Image

class MergedPlantDataset(Dataset):
    def __init__(self, split='train', transform=None):
        # Load split assignments
        splits = pd.read_csv('merged_output/reports/split_files_list.csv')
        self.data = splits[splits['split'] == split]
        
        # Load metadata
        metadata = pd.read_csv('merged_output/reports/merged_metadata.csv')
        self.data = self.data.merge(metadata, on='image_path')
        
        # Setup
        self.transform = transform
        self.classes = sorted(self.data['canonical_class'].unique())
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        
        # Load image
        image = Image.open(row['image_path']).convert('RGB')
        if self.transform:
            image = self.transform(image)
        
        # Get label
        label = self.class_to_idx[row['canonical_class']]
        
        return image, label

# Usage
from torchvision import transforms

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                       std=[0.229, 0.224, 0.225])
])

train_dataset = MergedPlantDataset('train', transform=transform)
val_dataset = MergedPlantDataset('val', transform=transform)
test_dataset = MergedPlantDataset('test', transform=transform)
holdout_dataset = MergedPlantDataset('holdout', transform=transform)
```

### Using Analysis Results

```python
import pandas as pd

# Load analysis
stats = pd.read_csv('dataset_analysis_output/statistics/global_statistics.csv')

# Get class distribution
print("Class distribution:")
print(stats[['class_name', 'image_count']].sort_values('image_count'))

# Identify underrepresented classes
threshold = 100
small_classes = stats[stats['image_count'] < threshold]
print(f"\nClasses needing augmentation: {len(small_classes)}")

# Filter high-quality images
metadata = pd.read_csv('merged_output/reports/merged_metadata.csv')
high_quality = metadata[metadata['quality_score'] > 80]
print(f"\nHigh quality images: {len(high_quality)}")
```

---

## Timeline Estimates

| Task | Small Dataset | Medium Dataset | Large Dataset |
|------|---------------|----------------|---------------|
| | (1K images) | (10K images) | (50K images) |
| **Merger** | 1 min | 8 min | 40 min |
| **Curator** | 2 min | 15 min | 60 min |
| **Taxonomy** | 1 min | 5 min | 15 min |
| **Visualizer** | 1 min | 5 min | 20 min |
| **Total** | ~5 min | ~30 min | ~2 hrs |

---

## Next Steps After Setup

1. ✅ **Review Reports**
   - `merged_output/reports/MERGE_SUMMARY.md`
   - `dataset_analysis_output/health_report.md`

2. ✅ **Verify Data Quality**
   - Check class distribution
   - Review duplicate removal
   - Inspect sample images

3. ✅ **Plan Training**
   - Choose architecture
   - Set hyperparameters
   - Define augmentation strategy

4. ✅ **Train Model**
   - Use `merged_dataset/train/`
   - Validate on `merged_dataset/val/`
   - Test on `merged_dataset/test/`

5. ✅ **Final Evaluation**
   - Evaluate on `merged_dataset/holdout/`
   - Report metrics
   - Document results

---

## Documentation Quick Reference

| Need | Read This |
|------|-----------|
| Merge datasets | `DATASET_MERGER_SUMMARY.md` |
| Understand merger | `DATASET_MERGER_README.md` |
| Analyze data | `IMPLEMENTATION_SUMMARY.md` |
| Design taxonomy | `TAXONOMY_IMPLEMENTATION_SUMMARY.md` |
| Quick commands | `QUICK_REFERENCE.md` |
| Full walkthrough | `COMPLETE_GUIDE.md` |
| Navigation | `INDEX.md` (this file) |

---

**Last Updated**: November 15, 2025  
**Version**: 2.0.0 (Added Dataset Merger)
