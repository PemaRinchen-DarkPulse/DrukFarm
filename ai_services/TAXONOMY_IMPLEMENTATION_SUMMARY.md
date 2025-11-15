# 🏗️ Label Taxonomy Designer - Implementation Summary

## ✅ What Has Been Created

### Core Script
**`label_taxonomy_designer.py`** (850+ lines)
- Automatic label extraction from all datasets
- Canonical taxonomy creation using hybrid strategy
- PascalCase naming convention enforcement
- Per-class count-based decision making
- Label normalization and conflict detection
- Healthy class hybrid handling
- Ambiguous label management with soft labeling
- Comprehensive output generation

### Supporting Scripts
**`dataset_reorganizer.py`** (350+ lines)
- Applies canonical taxonomy to reorganize datasets
- Creates train/val/test splits
- Handles duplicate filenames
- Generates reorganization statistics
- Tracks skipped images

**`python label_taxonomy_designer.py`**
- One-click execution
- Dependency checking
- Automated workflow

### Documentation
**`TAXONOMY_DESIGNER_GUIDE.md`**
- Complete usage guide
- Output file explanations
- Configuration options
- Best practices
- Integration workflows

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT: Multiple Plant Disease Datasets (~200 raw labels)   │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ label_taxonomy_designer.py      │
        │ (Hybrid Fine/Coarse Strategy)   │
        └─────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              OUTPUT: Canonical Taxonomy                      │
├─────────────────────────────────────────────────────────────┤
│ • canonical_taxonomy.csv                                    │
│ • raw_to_canonical_mapping.csv                              │
│ • automatic_label_conflicts.csv                             │
│ • taxonomy_decisions_log.csv                                │
│ • ambiguous_labels_handling.csv                             │
│ • taxonomy_rationale_report.txt                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ dataset_reorganizer.py          │
        │ (Apply Canonical Labels)        │
        └─────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CLEAN DATASET: ~80-100 canonical classes, ready for ML     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features Implemented

### 1. Hybrid Taxonomy Strategy ✅

**Fine-Grained** (when data supports it):
- Classes with ≥100 samples kept as distinct
- Preserves important medical distinctions
- Example: `TomatoEarlyBlight` vs `TomatoLateBlight`

**Coarse-Grained** (when data is sparse):
- Low-count variants merged into broader categories
- Prevents overfitting on small classes
- Example: 5 variants of "spot" with <50 each → `Spot`

**Decision Logic:**
```python
if total_samples >= 100 and has_high_count_variants:
    → Keep fine-grained
elif total_samples >= 100 but all_variants_low:
    → Merge to coarse
else:
    → Single label or exclude
```

### 2. PascalCase Naming Convention ✅

All canonical labels use consistent PascalCase:

| Raw Label | Canonical Label |
|-----------|-----------------|
| `tomato_early_blight` | `TomatoEarlyBlight` |
| `Tomato___Early_Blight` | `TomatoEarlyBlight` |
| `EARLY BLIGHT` | `EarlyBlight` |
| `healthy` | `Healthy` |
| `bacterial leaf spot` | `BacterialLeafSpot` |

**Format:** `[Crop][Severity][DiseaseType][Pathogen]`

### 3. Automatic Label Extraction ✅

Scans all datasets recursively:
- Extracts labels from folder structure
- Handles multiple naming conventions
- Skips common folder names (train/test/val)
- Counts images per label
- Tracks dataset sources

### 4. Label Normalization ✅

Cleans raw labels:
- Removes special characters: `_`, `-`, `.`
- Strips whitespace and prefixes
- Removes parentheses/metadata
- Converts to lowercase for comparison
- Aligns synonyms

### 5. Conflict Detection ✅

Automatically identifies:
- **Exact matches** after normalization (100% similarity)
- **Very similar** labels (>85% similarity)
- **Substring conflicts** (one contains another)
- **Same disease, different details** (severity variants)

Output: `automatic_label_conflicts.csv` for manual review

### 6. Disease Component Extraction ✅

Analyzes labels to identify:
- **Crop type:** Tomato, Rice, Potato, etc.
- **Disease type:** Blight, Spot, Rust, Rot, etc.
- **Severity:** Early, Late, Severe, Mild
- **Pathogen:** Bacterial, Fungal, Viral

Uses pattern matching on keywords:
```python
disease_keywords = {
    'blight': ['blight', 'blast'],
    'spot': ['spot', 'speck'],
    'rust': ['rust'],
    # ... 15+ disease types
}
```

### 7. Healthy Class Hybrid Handling ✅

**Strategy 1:** Single canonical `Healthy` class
- All "healthy", "normal" variants → `Healthy`
- Use in standard multi-class model

**Strategy 2:** Two-stage classification
```
Stage 1: Binary (Healthy vs Diseased)
    ↓ if Diseased
Stage 2: Multi-class (specific disease)
```

### 8. Ambiguous Label Management ✅

Three-tier approach:

| Scenario | Action | Example |
|----------|--------|---------|
| Truly ambiguous | Map to `Unknown` | "disease", "infected" |
| Multiple possibilities | Soft labeling | "blight_or_rust" |
| Partial info + data | Keep with low confidence | "leaf_damage" (150 samples) |
| Contradictory | Exclude | "healthy_diseased" |

Output: `ambiguous_labels_handling.csv`

### 9. Per-Class Count Analysis ✅

Makes data-driven decisions:

```python
# Example decision logic
if class_count >= 100:
    confidence = 'High'
    strategy = 'fine_grained'
elif class_count >= 50:
    confidence = 'Medium'
    strategy = 'evaluate'
elif class_count >= 20:
    confidence = 'Low'
    strategy = 'merge_to_coarse'
else:
    strategy = 'exclude_or_merge'
```

### 10. Comprehensive Outputs ✅

Six output files:

1. **canonical_taxonomy.csv** - Final class taxonomy
2. **raw_to_canonical_mapping.csv** - Complete mappings
3. **automatic_label_conflicts.csv** - Conflicts for review
4. **taxonomy_decisions_log.csv** - Decision audit trail
5. **ambiguous_labels_handling.csv** - Ambiguous strategies
6. **taxonomy_rationale_report.txt** - Human-readable summary

---

## 🚀 How to Use

### Quick Start
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python label_taxonomy_designer.py
```

### Manual Execution
```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python label_taxonomy_designer.py
```

### Expected Runtime
- Small datasets (<10k images): ~2 minutes
- Medium datasets (10-50k images): ~5 minutes
- Large datasets (50k+ images): ~10-15 minutes

---

## 📈 Expected Results

### Input Example
```
Raw labels across 11 datasets:
- Tomato_Early_Blight (1,234 images)
- Tomato___Early_Blight (567 images)
- early_blight (891 images)
- bacterial_spot (45 images)
- fungal_spot (38 images)
- brown_spot (70 images)
- healthy (4,523 images)
- Healthy (3,456 images)
- Normal (1,234 images)
... 200+ more labels
```

### Output Example
```
Canonical taxonomy (80-100 classes):
1. Healthy (15,234 images) - merged from 8 labels
2. TomatoEarlyBlight (3,456 images) - merged from 6 labels
3. RiceBlast (2,891 images) - merged from 3 labels
4. Spot (153 images) - merged from 5 low-count variants
5. TomatoLateBlight (2,345 images) - kept fine-grained
...
```

---

## 🔧 Configuration Options

### Thresholds

```python
# In label_taxonomy_designer.py
MIN_SAMPLES_FINE_GRAINED = 100  # Keep fine-grained if ≥ this
MIN_SAMPLES_KEEP_CLASS = 20     # Minimum to keep as separate class
```

**Adjust based on your needs:**

| Use Case | Fine-Grained | Keep Class |
|----------|--------------|------------|
| Research (detailed) | 50 | 10 |
| **Default (balanced)** | **100** | **20** |
| Production (robust) | 200 | 50 |

### Disease Keywords

Add new disease types:
```python
self.disease_keywords = {
    'blight': ['blight', 'blast'],
    'canker': ['canker', 'ulcer'],  # Add new
    'necrosis': ['necrosis', 'dead'],  # Add new
    # ...
}
```

### Crop Patterns

Add new crops:
```python
self.crop_patterns = [
    'rice', 'wheat', 'corn',
    'strawberry', 'blueberry',  # Add new
    # ...
]
```

---

## 🔄 Complete Workflow

### Phase 1: Analysis (Already Done)
```
✓ dataset_curator.py
  → Analyzed 11 datasets
  → Identified ~200 raw labels
  → Generated statistics
```

### Phase 2: Taxonomy Design (This Tool)
```
1. Run: `python label_taxonomy_designer.py`
2. Review: taxonomy_output/*.csv
3. Check: automatic_label_conflicts.csv
4. Verify: taxonomy_rationale_report.txt
```

### Phase 3: Dataset Reorganization (Optional)
```
1. Run: python dataset_reorganizer.py
2. Creates: canonical_dataset/
   ├── train/
   │   ├── Healthy/
   │   ├── TomatoEarlyBlight/
   │   └── ...
   ├── val/
   └── test/
```

### Phase 4: Model Training
```
Use canonical labels from mapping CSV:
- Load: raw_to_canonical_mapping.csv
- Train: Multi-class classifier
- Validate: On canonical classes
```

---

## 📊 Output File Details

### 1. canonical_taxonomy.csv
```csv
Canonical Label,Total Count,Number of Raw Labels,Strategy,Raw Labels
Healthy,15234,8,coarse_grained,"healthy,Healthy,Normal,..."
TomatoEarlyBlight,3456,3,fine_grained,"Tomato_Early_Blight,..."
```

### 2. raw_to_canonical_mapping.csv
```csv
raw_label,canonical_label,count,confidence,merge_reason,datasets,num_datasets
Tomato___Early_Blight,TomatoEarlyBlight,1500,High,Pattern match,Dataset1,1
early_blight,EarlyBlight,891,High,Low count merge,Dataset2,1
```

### 3. automatic_label_conflicts.csv
```csv
Label 1,Label 2,Similarity,Conflict Type
Tomato_Early_Blight,Tomato___Early_Blight,100,Exact match
bacterial_spot,bacterial_leaf_spot,85,Very similar
```

### 4. taxonomy_decisions_log.csv
```csv
group,decision,canonical,count,reason
blight,Keep fine-grained,TomatoEarlyBlight,3456,Sufficient samples
spot,Merge to coarse,Spot,153,Merged 5 low-count variants
```

### 5. taxonomy_rationale_report.txt
Human-readable summary with:
- Overview statistics
- Top 20 classes
- Merge decision breakdown
- Detailed examples
- Recommendations

---

## 🎯 Use Cases

### 1. Multi-Dataset Consolidation
Combine 11 datasets with consistent labels:
```python
# Before: 200+ inconsistent labels
# After: 80-100 canonical labels
```

### 2. Model Training
```python
# Load mapping
mapping = pd.read_csv('raw_to_canonical_mapping.csv')
label_map = dict(zip(mapping['raw_label'], mapping['canonical_label']))

# Convert labels
y_canonical = [label_map[y_raw] for y_raw in y_raw_labels]
```

### 3. Label Standardization
```python
# Rename folders to canonical labels
for class_folder in dataset_path.iterdir():
    canonical = label_map[class_folder.name]
    class_folder.rename(class_folder.parent / canonical)
```

---

## 🔍 Quality Assurance

### Automated Checks
- ✅ Duplicate detection (exact matches)
- ✅ Similarity analysis (near matches)
- ✅ Sample count validation
- ✅ Conflict identification
- ✅ Ambiguity flagging

### Manual Review Points
1. Check `automatic_label_conflicts.csv` (conflicts ≥85%)
2. Verify low-confidence mappings
3. Review merge decisions in log
4. Confirm important distinctions kept

---

## 🎓 Benefits

### Before Taxonomy Design
- ❌ 200+ inconsistent labels
- ❌ Multiple naming conventions
- ❌ Typos and formatting issues
- ❌ Unclear class boundaries
- ❌ Hard to combine datasets

### After Taxonomy Design
- ✅ 80-100 canonical classes
- ✅ Consistent PascalCase naming
- ✅ Data-driven hierarchy
- ✅ Clear class definitions
- ✅ Ready for multi-dataset training

---

## 📝 Next Steps

After running taxonomy designer:

1. **Review Outputs**
   - Read `taxonomy_rationale_report.txt`
   - Check conflicts in CSV
   - Verify top classes make sense

2. **Manual Adjustments** (if needed)
   - Edit `raw_to_canonical_mapping.csv`
   - Add custom mappings
   - Document changes

3. **Reorganize Datasets**
   - Run `dataset_reorganizer.py`
   - Creates clean dataset structure
   - Train/val/test splits

4. **Begin Model Development**
   - Use canonical labels
   - Implement data loaders
   - Start training

---

## 🆘 Troubleshooting

### Too Many Classes
**Problem:** 150+ canonical classes

**Solution:**
- Increase `MIN_SAMPLES_FINE_GRAINED` to 200
- Re-run taxonomy designer

### Important Distinctions Lost
**Problem:** EarlyBlight and LateBlight merged

**Solution:**
- Check sample counts in decisions log
- If >100 samples each, should be separate
- Review disease keyword patterns

### High Conflict Count
**Problem:** 100+ conflicts detected

**Solution:**
- Focus on >90% similarity first
- Many may be false positives
- Verify intended distinctions

---

## 📞 Integration Points

### With Dataset Curator
```
1. Run dataset_curator.py (analysis)
2. Review class_distribution.csv
3. Run label_taxonomy_designer.py
4. Use canonical taxonomy going forward
```

### With Model Training
```python
# In data loader
mapping = pd.read_csv('raw_to_canonical_mapping.csv')
label_encoder = LabelEncoder()
label_encoder.fit(mapping['canonical_label'].unique())
```

### With Data Augmentation
```python
# Focus augmentation on classes <100 samples
small_classes = taxonomy_df[taxonomy_df['Total Count'] < 100]
for class_name in small_classes['Canonical Label']:
    apply_augmentation(class_name)
```

---

## ✨ Summary

**Created:** Complete label taxonomy design system

**Features:**
- ✅ Hybrid fine/coarse strategy
- ✅ PascalCase naming
- ✅ Automatic conflict detection
- ✅ Ambiguous label handling
- ✅ Data-driven decisions
- ✅ Comprehensive documentation

**Outputs:**
- 6 CSV/TXT files with complete taxonomy
- Audit trail of all decisions
- Conflict reports for review

**Status:** ✅ **READY TO USE**

**Next Action:** `python label_taxonomy_designer.py`

---

**Created:** 2025-11-15  
**Version:** 1.0  
**For:** DrukFarm Plant Disease Detection System
