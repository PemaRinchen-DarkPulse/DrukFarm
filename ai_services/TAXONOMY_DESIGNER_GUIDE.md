# Label Taxonomy Designer - Complete Guide

## 🎯 Purpose

Creates a **canonical, unified label taxonomy** from multiple plant disease datasets using a hybrid fine-grained/coarse-grained strategy based on per-class sample counts.

## 🚀 Quick Start

```cmd
cd ai_services
drukFarmVenv\Scripts\activate
python label_taxonomy_designer.py
```

**Runtime:** 5-15 minutes depending on dataset size

## 📊 What It Does

### Core Features

1. **Automatic Label Extraction**
   - Recursively scans all 11 datasets
   - Extracts labels from folder structure
   - Handles multiple naming conventions
   - Counts images per label

2. **Canonical Taxonomy Creation**
   - **Hybrid Strategy:** Fine-grained when data supports it, coarse-grained otherwise
   - **PascalCase Naming:** `EarlyBlight`, `TomatoLeafSpot`, `Healthy`
   - **Per-Class Decisions:** Analyzes sample counts to decide taxonomy level
   - **Disease Component Extraction:** Identifies crop, disease type, severity, pathogen

3. **Label Normalization**
   - Removes special characters and formatting
   - Standardizes naming conventions
   - Aligns synonyms (e.g., `Early_Blight` → `EarlyBlight`)
   - Cleans metadata artifacts

4. **Conflict Detection**
   - Finds exact matches after normalization
   - Identifies similar labels (typos, variations)
   - Detects same disease with different details
   - Generates conflict report for review

5. **Hybrid Healthy Handling**
   - Creates canonical `Healthy` class
   - Supports two-stage classification:
     - Stage 1: Binary (Healthy/Diseased) pre-filter
     - Stage 2: Multi-class disease classification

6. **Ambiguous Label Management**
   - **Unknown:** Truly generic/ambiguous labels
   - **Soft Labels:** Multiple possibilities (e.g., "Blight or Rust")
   - **Low Confidence:** Partial info but sufficient samples
   - **Discard:** Unusable/contradictory labels

## 📁 Output Files

### Main Deliverables

```
taxonomy_output/
├── canonical_taxonomy.csv           # Final class taxonomy
├── raw_to_canonical_mapping.csv     # Complete label mapping
├── automatic_label_conflicts.csv    # Conflicts for review
├── taxonomy_decisions_log.csv       # Decision audit trail
├── ambiguous_labels_handling.csv    # Ambiguous strategies
└── taxonomy_rationale_report.txt    # Human-readable summary
```

### File Details

#### 1. canonical_taxonomy.csv
The final taxonomy with canonical class names.

**Columns:**
- `Canonical Label` - PascalCase canonical name
- `Total Count` - Images in this class
- `Number of Raw Labels` - How many raw labels map to this
- `Strategy` - fine_grained / coarse_grained / single_label
- `Raw Labels` - Original label names

**Example:**
```csv
Canonical Label,Total Count,Number of Raw Labels,Strategy,Raw Labels
Healthy,15234,8,coarse_grained,healthy,Healthy,Normal,healthy_leaf,...
TomatoEarlyBlight,3456,3,fine_grained,Tomato_Early_Blight,early_blight_tomato,...
RiceBrownSpot,2891,2,fine_grained,brown_spot,BrownSpot
Blight,1234,5,coarse_grained,blight,late_blight,bacterial_blight,...
```

#### 2. raw_to_canonical_mapping.csv
Maps every raw label to its canonical form.

**Columns:**
- `raw_label` - Original label from dataset
- `canonical_label` - Mapped canonical name
- `count` - Images with this raw label
- `confidence` - High/Medium/Low
- `merge_reason` - Why this mapping was chosen
- `datasets` - Which datasets contain this label
- `num_datasets` - Number of datasets

**Example:**
```csv
raw_label,canonical_label,count,confidence,merge_reason,datasets,num_datasets
Tomato___Early_Blight,TomatoEarlyBlight,1500,High,Extracted from pattern matching,New Plant Diseases Dataset(Augmented),1
early_blight,EarlyBlight,891,High,Merged severity variants (low count: 891),BPLD Dataset,1
healthy,Healthy,4523,High,Standard healthy class,Rice Dataset;BPLD Dataset,2
```

#### 3. automatic_label_conflicts.csv
Labels that may conflict or overlap.

**Columns:**
- `Label 1` / `Label 2` - Conflicting labels
- `Count 1` / `Count 2` - Sample counts
- `Similarity` - Similarity score (0-100)
- `Conflict Type` - Why they conflict
- `Normalized 1` / `Normalized 2` - Cleaned versions

**Example:**
```csv
Label 1,Label 2,Count 1,Count 2,Similarity,Conflict Type,Normalized 1,Normalized 2
Tomato_Early_Blight,Tomato___Early_Blight,1234,5678,100,Exact match after normalization,tomato early blight,tomato early blight
bacterial_spot,bacterial_leaf_spot,456,789,85,Very similar wording,bacterial spot,bacterial leaf spot
early_blight,late_blight,2345,3456,60,Same disease different severity/type,early blight,late blight
```

#### 4. taxonomy_decisions_log.csv
Audit trail of all taxonomy decisions.

**Columns:**
- `group` - Disease group (e.g., "blight")
- `decision` - Keep fine-grained / Merge to coarse / Keep as-is
- `canonical` - Resulting canonical label
- `count` - Total samples
- `reason` - Decision rationale

**Example:**
```csv
group,decision,canonical,count,reason
blight,Keep fine-grained,TomatoEarlyBlight,3456,Sufficient samples (3456 >= 100)
blight,Merge to coarse,Blight,1234,Merged 5 low-count variants into single class
spot,Keep fine-grained,RiceBrownSpot,2891,Sufficient samples (2891 >= 100)
```

#### 5. ambiguous_labels_handling.csv
How ambiguous labels were handled.

**Columns:**
- All from mapping CSV plus:
- `ambiguous_handling` - Strategy used
- `soft_label` - Boolean (if applicable)

**Example:**
```csv
raw_label,canonical_label,confidence,ambiguous_handling
disease,Unknown,Low,Map to Unknown (too generic)
blight_or_rust,BlightOrRust,Low,Soft label (multiple possibilities)
unknown_disease,Unknown,Low,Map to Unknown (insufficient info and low count)
```

#### 6. taxonomy_rationale_report.txt
Human-readable summary of all decisions.

**Contents:**
- Overview statistics
- Taxonomy strategy explanation
- Top 20 canonical classes
- Merge decision breakdown
- Detailed examples
- Healthy class handling
- Ambiguous label strategies
- Conflict summary
- Recommendations

## ⚙️ Configuration

### Thresholds (in `label_taxonomy_designer.py`)

```python
MIN_SAMPLES_FINE_GRAINED = 100  # Keep fine-grained if ≥100 samples
MIN_SAMPLES_KEEP_CLASS = 20     # Minimum to keep as separate class
```

**How it works:**

| Scenario | Sample Count | Action |
|----------|--------------|--------|
| High-count variant | ≥100 | Keep fine-grained (e.g., `EarlyBlight`) |
| Medium-count group | 50-99 total | Merge to coarse (e.g., `Blight`) |
| Low-count variant | <50 | Merge or discard |
| Very low count | <20 | Consider excluding |

### Disease Keywords

Automatically detected patterns:

```python
disease_keywords = {
    'blight': ['blight', 'blast'],
    'spot': ['spot', 'speck'],
    'rust': ['rust'],
    'rot': ['rot', 'decay'],
    'mold': ['mold', 'mould', 'mildew'],
    'wilt': ['wilt'],
    'mosaic': ['mosaic'],
    'curl': ['curl', 'rolling'],
    'scorch': ['scorch', 'burn'],
    # ... add more as needed
}
```

### Crop Patterns

```python
crop_patterns = [
    'rice', 'wheat', 'corn', 'maize', 'tomato', 'potato',
    'bean', 'soybean', 'sugarcane', 'cotton', 'grape',
    # ... add more crops
]
```

## 🎨 PascalCase Naming Convention

All canonical labels use PascalCase for consistency:

**Examples:**
- `Healthy` (not `healthy` or `HEALTHY`)
- `TomatoEarlyBlight` (not `tomato_early_blight`)
- `RiceBrownSpot` (not `rice-brown-spot`)
- `BacterialLeafSpot` (not `Bacterial_Leaf_Spot`)

**Format:**
```
[Crop][Severity][DiseaseType][Pathogen]
```

**Components (all optional):**
- `Crop`: Tomato, Rice, Potato, etc.
- `Severity`: Early, Late, Severe, Mild
- `DiseaseType`: Blight, Spot, Rust, Rot, etc.
- `Pathogen`: Bacterial, Fungal, Viral

## 🔄 Taxonomy Strategy

### Fine-Grained (Sufficient Data)

When a disease variant has **≥100 samples**, keep it separate:

```
RiceBlast (500 samples) → RiceBlast ✓
TomatoEarlyBlight (450 samples) → TomatoEarlyBlight ✓
TomatoLateBlight (380 samples) → TomatoLateBlight ✓
```

### Coarse-Grained (Low Variant Counts)

When variants have **<100 samples each**, merge:

```
bacterial_spot (45 samples)  ┐
fungal_spot (38 samples)     ├→ Spot (153 samples total)
brown_spot (70 samples)      ┘
```

### Hybrid Example

```
Disease Group: Blight
├─ TomatoEarlyBlight: 450 samples → Keep fine-grained ✓
├─ TomatoLateBlight: 380 samples → Keep fine-grained ✓
├─ bacterial_blight: 45 samples  ┐
├─ fungal_blight: 38 samples     ├→ Merge to "Blight"
└─ common_blight: 52 samples     ┘
```

## 🏥 Healthy Class Strategy

### Option 1: Single Multi-Class Model
```
Input Image
    ↓
Multi-Class Classifier
    ├─ Healthy
    ├─ TomatoEarlyBlight
    ├─ RiceBlast
    └─ ... (other diseases)
```

### Option 2: Two-Stage Classification (Recommended)
```
Input Image
    ↓
Stage 1: Binary Classifier (Healthy vs Diseased)
    ├─ Healthy → Output: "Healthy"
    └─ Diseased
        ↓
    Stage 2: Multi-Class Disease Classifier
        ├─ TomatoEarlyBlight
        ├─ RiceBlast
        └─ ... (diseases only)
```

**Benefits of Two-Stage:**
- Better accuracy for healthy detection
- Faster inference (skip stage 2 if healthy)
- Easier to update disease classes

## 🔍 Conflict Resolution

### Automatic Detection

The system finds:

1. **Exact Matches:** Same label, different formatting
   ```
   Tomato_Early_Blight == Tomato___Early_Blight
   → Map both to TomatoEarlyBlight
   ```

2. **Similar Wording:** Typos or variations
   ```
   bacterial_spot ≈ bacterial_leaf_spot (85% similar)
   → Review manually
   ```

3. **Same Disease, Different Details:**
   ```
   early_blight, late_blight → both contain "blight"
   → Decide: Keep separate or merge?
   ```

### Manual Review Required

Check `automatic_label_conflicts.csv` for:
- Conflicts with similarity ≥85%
- Unexpected groupings
- Labels that should be separate

## 🎯 Use Cases

### 1. Dataset Reorganization

After taxonomy design, reorganize datasets:

```python
# Read mapping
mapping = pd.read_csv('raw_to_canonical_mapping.csv')

# For each image, rename folder to canonical label
for img_path in images:
    raw_label = get_label_from_path(img_path)
    canonical = mapping[mapping['raw_label'] == raw_label]['canonical_label'].iloc[0]
    new_path = img_path.parent.parent / canonical / img_path.name
    move_image(img_path, new_path)
```

### 2. Model Training Labels

Use canonical labels for training:

```python
# Load mapping
label_map = dict(zip(mapping['raw_label'], mapping['canonical_label']))

# Convert dataset labels
y_train_canonical = [label_map[raw_label] for raw_label in y_train_raw]
```

### 3. Dataset Merging

Combine multiple datasets with consistent labels:

```python
# All datasets now use same label vocabulary
combined_dataset = []
for dataset in datasets:
    for img, raw_label in dataset:
        canonical_label = label_map[raw_label]
        combined_dataset.append((img, canonical_label))
```

## 📊 Expected Results

### Before Taxonomy Design
```
200+ raw labels across 11 datasets
- Tomato_Early_Blight
- Tomato___Early_Blight
- early_blight
- Early Blight
- EB
- tomato early blight
... (inconsistent naming)
```

### After Taxonomy Design
```
~80-100 canonical classes
- TomatoEarlyBlight (3,456 samples, merged from 6 raw labels)
- Healthy (15,234 samples, merged from 8 raw labels)
- RiceBlast (2,891 samples, merged from 3 raw labels)
... (consistent PascalCase)
```

## 🛠️ Customization

### Add New Disease Keywords

Edit `label_taxonomy_designer.py`:

```python
self.disease_keywords = {
    'blight': ['blight', 'blast'],
    'spot': ['spot', 'speck'],
    # Add new disease type:
    'canker': ['canker', 'ulcer'],
    # ... 
}
```

### Add New Crop Types

```python
self.crop_patterns = [
    'rice', 'wheat', 'corn',
    # Add new crops:
    'strawberry', 'blueberry', 'cucumber',
    # ...
]
```

### Adjust Thresholds

```python
MIN_SAMPLES_FINE_GRAINED = 150  # More strict (default: 100)
MIN_SAMPLES_KEEP_CLASS = 50     # Higher minimum (default: 20)
```

## 🔧 Troubleshooting

### Issue: Too Many Classes

**Problem:** Taxonomy has 200+ classes

**Solution:**
1. Increase `MIN_SAMPLES_FINE_GRAINED` to 200+
2. This will merge more low-count variants
3. Re-run taxonomy designer

### Issue: Important Distinctions Lost

**Problem:** EarlyBlight and LateBlight merged incorrectly

**Solution:**
1. Check sample counts in `taxonomy_decisions_log.csv`
2. If counts are sufficient (>100), they should be separate
3. Manually edit `disease_keywords` to distinguish them
4. Re-run taxonomy designer

### Issue: Many Conflicts

**Problem:** `automatic_label_conflicts.csv` has 100+ conflicts

**Solution:**
1. Sort by similarity score
2. Focus on conflicts >90% similarity first
3. Manually verify intended distinctions
4. Update mapping CSV if needed

### Issue: Unknown Class Too Large

**Problem:** Many labels mapped to "Unknown"

**Solution:**
1. Check `ambiguous_labels_handling.csv`
2. Review labels marked as "too generic"
3. Add specific patterns to `disease_keywords`
4. Lower confidence threshold if needed

## 📝 Best Practices

### Before Running
- ✅ Run dataset curator first (understand your data)
- ✅ Review class distribution statistics
- ✅ Identify which diseases are well-represented

### During Review
- ✅ Check top 20 classes in rationale report
- ✅ Review all high-similarity conflicts (≥85%)
- ✅ Verify low-confidence mappings
- ✅ Confirm merge decisions make sense

### After Taxonomy Design
- ✅ Reorganize datasets using canonical labels
- ✅ Update data loaders to use mapping CSV
- ✅ Document any manual mapping overrides
- ✅ Version control taxonomy files

## 🔄 Integration with Dataset Curator

**Workflow:**
```
1. Run dataset_curator.py
   ↓ (analyze datasets)
2. Review class_distribution.csv
   ↓ (understand label landscape)
3. Run label_taxonomy_designer.py
   ↓ (create canonical taxonomy)
4. Review taxonomy outputs
   ↓ (verify mappings)
5. Reorganize datasets
   ↓ (apply canonical labels)
6. Re-run dataset_curator.py
   ↓ (verify clean taxonomy)
7. Begin model training
```

## 📚 Next Steps

After taxonomy design:

1. **Reorganize Datasets** - Apply canonical labels to folder structure
2. **Update Data Loaders** - Use mapping CSV in training code
3. **Plan Data Augmentation** - Focus on classes <100 samples
4. **Design Model Architecture** - Consider hierarchical if needed
5. **Create Label Encoder** - Map canonical labels to integers
6. **Document Taxonomy** - Share with team/stakeholders

## 🎓 Understanding Decisions

### Why Hybrid?

**Pure Fine-Grained:**
- ❌ Too many classes (200+)
- ❌ Many classes with <50 samples
- ❌ Harder to train, lower accuracy

**Pure Coarse-Grained:**
- ❌ Loses important distinctions
- ❌ EarlyBlight vs LateBlight matters!
- ❌ Less useful for diagnosis

**Hybrid (This System):**
- ✅ Keep distinctions when data supports it
- ✅ Merge when classes are too small
- ✅ Balanced taxonomy for best performance

### Sample Count Thresholds

| Count | Strategy | Rationale |
|-------|----------|-----------|
| ≥100 | Fine-grained | Enough data for model to learn |
| 50-99 | Evaluate | May keep if important |
| 20-49 | Merge | Too few for reliable training |
| <20 | Exclude | Not enough data |

---

**Version:** 1.0  
**Created:** 2025-11-15  
**For:** DrukFarm Plant Disease Detection System
