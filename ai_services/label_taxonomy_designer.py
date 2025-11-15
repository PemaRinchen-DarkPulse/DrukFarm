"""
Label Taxonomy Designer for Multi-Dataset Plant Disease Classification
Creates canonical unified taxonomy with hybrid fine-grained/coarse-grained strategy
"""

import os
import re
import json
import csv
from pathlib import Path
from collections import defaultdict, Counter
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class LabelTaxonomyDesigner:
    """Design and implement canonical label taxonomy across multiple datasets"""
    
    def __init__(self, datasets_root, output_dir="taxonomy_output", min_samples_fine_grained=100):
        self.datasets_root = Path(datasets_root)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Thresholds for taxonomy decisions
        self.min_samples_fine_grained = min_samples_fine_grained
        self.min_samples_keep_class = 20  # Minimum to keep as separate class
        
        # Data structures
        self.raw_labels = []  # All raw labels found
        self.label_counts = Counter()  # Count per raw label
        self.dataset_labels = defaultdict(list)  # Labels per dataset
        self.canonical_taxonomy = {}  # Final taxonomy
        self.mapping_records = []  # Raw to canonical mappings
        self.conflicts = []  # Detected conflicts
        self.taxonomy_decisions = []  # Decision log
        
        # Disease keywords and patterns
        self.disease_keywords = {
            'blight': ['blight', 'blast'],
            'spot': ['spot', 'speck'],
            'rust': ['rust'],
            'rot': ['rot', 'decay'],
            'mold': ['mold', 'mould', 'mildew'],
            'wilt': ['wilt'],
            'mosaic': ['mosaic'],
            'curl': ['curl', 'rolling'],
            'scorch': ['scorch', 'burn'],
            'streak': ['streak', 'stripe'],
            'virus': ['virus', 'viral'],
            'bacterial': ['bacterial', 'bacteria'],
            'fungal': ['fungal', 'fungus'],
            'nutrient': ['deficiency', 'nutrient'],
            'pest': ['pest', 'insect']
        }
        
        # Crop type patterns
        self.crop_patterns = [
            'rice', 'wheat', 'corn', 'maize', 'tomato', 'potato', 'bean',
            'soybean', 'sugarcane', 'cotton', 'grape', 'apple', 'citrus',
            'pepper', 'okra', 'mango', 'banana', 'tea', 'coffee'
        ]
        
        print(f"[✓] Label Taxonomy Designer initialized")
        print(f"[✓] Datasets root: {self.datasets_root}")
        print(f"[✓] Output directory: {self.output_dir}")
        print(f"[✓] Fine-grained threshold: {self.min_samples_fine_grained} samples")
    
    def extract_all_labels(self):
        """Extract all raw labels from all datasets"""
        print("\n" + "="*70)
        print("STEP 1: EXTRACTING ALL RAW LABELS")
        print("="*70)
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        
        for dataset_folder in self.datasets_root.iterdir():
            if not dataset_folder.is_dir():
                continue
            
            print(f"\n📁 Scanning: {dataset_folder.name}")
            dataset_name = dataset_folder.name
            dataset_labels = set()
            
            # Scan for images and extract labels from folder structure
            for img_ext in image_extensions:
                for img_path in dataset_folder.rglob(f"*{img_ext}"):
                    # Extract label from folder structure
                    relative_path = img_path.relative_to(dataset_folder)
                    parts = relative_path.parts
                    
                    # Try to identify class label from path
                    label = None
                    if len(parts) >= 2:
                        # Skip common folder names
                        skip_names = {'train', 'test', 'val', 'validation', 'images', 
                                    'data', 'dataset', 'samples'}
                        
                        # Check parent folder
                        potential_label = parts[-2]
                        if potential_label.lower() not in skip_names:
                            label = potential_label
                        elif len(parts) >= 3:
                            potential_label = parts[-3]
                            if potential_label.lower() not in skip_names:
                                label = potential_label
                    
                    if label:
                        self.raw_labels.append({
                            'dataset': dataset_name,
                            'raw_label': label,
                            'path': str(img_path)
                        })
                        self.label_counts[label] += 1
                        dataset_labels.add(label)
            
            self.dataset_labels[dataset_name] = sorted(list(dataset_labels))
            print(f"   Found {len(dataset_labels)} unique labels, {sum(1 for r in self.raw_labels if r['dataset'] == dataset_name)} images")
        
        print(f"\n[✓] Total raw labels extracted: {len(self.label_counts)}")
        print(f"[✓] Total images processed: {len(self.raw_labels)}")
        
        return self.label_counts
    
    def normalize_label(self, raw_label):
        """Normalize a raw label to standardized format"""
        # Convert to string and strip whitespace
        label = str(raw_label).strip()
        
        # Remove common prefixes/suffixes
        label = re.sub(r'^(class_|label_|disease_)', '', label, flags=re.IGNORECASE)
        
        # Replace special characters with spaces
        label = re.sub(r'[_\-\.]+', ' ', label)
        
        # Remove extra whitespace
        label = re.sub(r'\s+', ' ', label).strip()
        
        # Remove parentheses and brackets content (often metadata)
        label = re.sub(r'\([^)]*\)|\[[^\]]*\]', '', label).strip()
        
        # Lowercase for comparison
        label_lower = label.lower()
        
        return label, label_lower
    
    def extract_disease_components(self, label_lower):
        """Extract disease type, severity, and crop from label"""
        components = {
            'crop': None,
            'disease_type': None,
            'severity': None,
            'pathogen': None,
            'is_healthy': False
        }
        
        # Check for healthy
        if 'healthy' in label_lower or 'normal' in label_lower:
            components['is_healthy'] = True
            return components
        
        # Extract crop
        for crop in self.crop_patterns:
            if crop in label_lower:
                components['crop'] = crop.title()
                break
        
        # Extract disease type
        for disease, keywords in self.disease_keywords.items():
            for keyword in keywords:
                if keyword in label_lower:
                    components['disease_type'] = disease.title()
                    break
            if components['disease_type']:
                break
        
        # Extract severity
        if 'early' in label_lower:
            components['severity'] = 'Early'
        elif 'late' in label_lower:
            components['severity'] = 'Late'
        elif 'severe' in label_lower or 'advanced' in label_lower:
            components['severity'] = 'Severe'
        elif 'mild' in label_lower or 'minor' in label_lower:
            components['severity'] = 'Mild'
        
        # Extract pathogen type
        if 'bacterial' in label_lower:
            components['pathogen'] = 'Bacterial'
        elif 'fungal' in label_lower or 'fungus' in label_lower:
            components['pathogen'] = 'Fungal'
        elif 'viral' in label_lower or 'virus' in label_lower:
            components['pathogen'] = 'Viral'
        
        return components
    
    def to_pascal_case(self, text):
        """Convert text to PascalCase"""
        if not text:
            return ""
        
        # Split by spaces and capitalize each word
        words = text.strip().split()
        return ''.join(word.capitalize() for word in words)
    
    def build_canonical_label(self, raw_label, count, components):
        """Build canonical label using hybrid strategy"""
        
        # Handle healthy images
        if components['is_healthy']:
            return 'Healthy', 'High', 'Standard healthy class'
        
        # Build canonical name
        parts = []
        
        # Add crop if present and specific
        if components['crop']:
            parts.append(components['crop'])
        
        # Add severity if present and count is high enough
        if components['severity'] and count >= self.min_samples_fine_grained:
            parts.append(components['severity'])
        
        # Add disease type
        if components['disease_type']:
            parts.append(components['disease_type'])
        elif components['pathogen']:
            parts.append(components['pathogen'])
        else:
            # Use cleaned version of original label if no disease type identified
            normalized, _ = self.normalize_label(raw_label)
            parts.append(normalized)
        
        # Add pathogen if not already included
        if components['pathogen'] and components['disease_type']:
            parts.append(components['pathogen'])
        
        # Convert to PascalCase
        canonical = self.to_pascal_case(' '.join(parts))
        
        # Determine confidence
        if components['disease_type'] or components['is_healthy']:
            confidence = 'High'
        elif components['pathogen']:
            confidence = 'Medium'
        else:
            confidence = 'Low'
        
        # Reason for mapping
        reason = f"Extracted from pattern matching"
        if count < self.min_samples_fine_grained and components['severity']:
            reason = f"Merged severity variants (low count: {count})"
        
        return canonical, confidence, reason
    
    def detect_label_conflicts(self):
        """Detect potential conflicts in label naming"""
        print("\n" + "="*70)
        print("STEP 2: DETECTING LABEL CONFLICTS")
        print("="*70)
        
        conflicts = []
        labels_list = list(self.label_counts.keys())
        
        # Compare each pair of labels
        for i, label1 in enumerate(labels_list):
            norm1, lower1 = self.normalize_label(label1)
            
            for label2 in labels_list[i+1:]:
                norm2, lower2 = self.normalize_label(label2)
                
                # Check for similar labels
                similarity_score = 0
                
                # Exact match after normalization
                if lower1 == lower2:
                    similarity_score = 100
                    conflict_type = "Exact match after normalization"
                
                # Very similar (Levenshtein-like)
                elif self._string_similarity(lower1, lower2) > 0.85:
                    similarity_score = 85
                    conflict_type = "Very similar wording"
                
                # One is substring of other
                elif lower1 in lower2 or lower2 in lower1:
                    similarity_score = 70
                    conflict_type = "One label contains the other"
                
                # Same disease type but different details
                elif self._same_disease_different_details(lower1, lower2):
                    similarity_score = 60
                    conflict_type = "Same disease, different severity/type"
                
                if similarity_score > 0:
                    conflicts.append({
                        'Label 1': label1,
                        'Label 2': label2,
                        'Count 1': self.label_counts[label1],
                        'Count 2': self.label_counts[label2],
                        'Similarity': similarity_score,
                        'Conflict Type': conflict_type,
                        'Normalized 1': norm1,
                        'Normalized 2': norm2
                    })
        
        self.conflicts = conflicts
        print(f"\n[✓] Found {len(conflicts)} potential conflicts")
        
        return conflicts
    
    def _string_similarity(self, s1, s2):
        """Calculate simple string similarity"""
        # Jaccard similarity on character bigrams
        def get_bigrams(s):
            return set(s[i:i+2] for i in range(len(s)-1))
        
        b1 = get_bigrams(s1)
        b2 = get_bigrams(s2)
        
        if not b1 or not b2:
            return 0.0
        
        intersection = len(b1 & b2)
        union = len(b1 | b2)
        
        return intersection / union if union > 0 else 0.0
    
    def _same_disease_different_details(self, label1, label2):
        """Check if labels represent same disease with different details"""
        # Extract disease keywords from both
        disease1 = None
        disease2 = None
        
        for disease, keywords in self.disease_keywords.items():
            for keyword in keywords:
                if keyword in label1:
                    disease1 = disease
                if keyword in label2:
                    disease2 = disease
        
        # Same disease but different labels
        return disease1 and disease2 and disease1 == disease2 and label1 != label2
    
    def create_canonical_taxonomy(self):
        """Create canonical taxonomy using hybrid approach"""
        print("\n" + "="*70)
        print("STEP 3: CREATING CANONICAL TAXONOMY")
        print("="*70)
        
        # Group labels by normalized form
        label_groups = defaultdict(list)
        
        for raw_label, count in self.label_counts.items():
            normalized, lower = self.normalize_label(raw_label)
            components = self.extract_disease_components(lower)
            
            # Create grouping key based on main disease type
            if components['is_healthy']:
                group_key = 'healthy'
            elif components['disease_type']:
                group_key = components['disease_type'].lower()
            elif components['pathogen']:
                group_key = components['pathogen'].lower()
            else:
                group_key = lower
            
            label_groups[group_key].append({
                'raw_label': raw_label,
                'count': count,
                'components': components,
                'normalized': normalized
            })
        
        print(f"\nGrouped into {len(label_groups)} disease categories")
        
        # Process each group
        canonical_labels = {}
        mapping_records = []
        decisions = []
        
        for group_key, labels in label_groups.items():
            total_count = sum(l['count'] for l in labels)
            
            print(f"\n📊 Processing group: {group_key}")
            print(f"   Labels in group: {len(labels)}, Total samples: {total_count}")
            
            # Decide on taxonomy strategy
            if total_count >= self.min_samples_fine_grained and len(labels) > 1:
                # Check if we should keep fine-grained
                has_high_count_variants = any(
                    l['count'] >= self.min_samples_fine_grained 
                    for l in labels
                )
                
                if has_high_count_variants:
                    # Keep fine-grained for high-count variants
                    strategy = 'fine_grained'
                    print(f"   Strategy: FINE-GRAINED (sufficient data per variant)")
                else:
                    # Merge into coarse label
                    strategy = 'coarse_grained'
                    print(f"   Strategy: COARSE-GRAINED (merge low-count variants)")
            else:
                # Single label or low total count
                strategy = 'single_label'
                print(f"   Strategy: SINGLE LABEL")
            
            # Apply strategy
            if strategy == 'fine_grained':
                # Create canonical label for each variant
                for label_info in labels:
                    canonical, confidence, reason = self.build_canonical_label(
                        label_info['raw_label'],
                        label_info['count'],
                        label_info['components']
                    )
                    
                    canonical_labels[canonical] = {
                        'count': label_info['count'],
                        'raw_labels': [label_info['raw_label']],
                        'strategy': strategy
                    }
                    
                    mapping_records.append({
                        'raw_label': label_info['raw_label'],
                        'canonical_label': canonical,
                        'count': label_info['count'],
                        'confidence': confidence,
                        'merge_reason': reason
                    })
                    
                    decisions.append({
                        'group': group_key,
                        'decision': 'Keep fine-grained',
                        'canonical': canonical,
                        'count': label_info['count'],
                        'reason': f"Sufficient samples ({label_info['count']} >= {self.min_samples_fine_grained})"
                    })
            
            elif strategy == 'coarse_grained':
                # Merge all variants into single canonical label
                # Use the most common variant or create generic name
                most_common = max(labels, key=lambda x: x['count'])
                
                # Build coarse canonical name (without severity)
                components = most_common['components'].copy()
                components['severity'] = None  # Remove severity for coarse label
                
                canonical, confidence, reason = self.build_canonical_label(
                    most_common['raw_label'],
                    total_count,
                    components
                )
                
                canonical_labels[canonical] = {
                    'count': total_count,
                    'raw_labels': [l['raw_label'] for l in labels],
                    'strategy': strategy
                }
                
                for label_info in labels:
                    mapping_records.append({
                        'raw_label': label_info['raw_label'],
                        'canonical_label': canonical,
                        'count': label_info['count'],
                        'confidence': confidence,
                        'merge_reason': f"Merged into coarse label (low variant counts)"
                    })
                
                decisions.append({
                    'group': group_key,
                    'decision': 'Merge to coarse',
                    'canonical': canonical,
                    'count': total_count,
                    'reason': f"Merged {len(labels)} low-count variants into single class"
                })
            
            else:  # single_label
                label_info = labels[0]
                canonical, confidence, reason = self.build_canonical_label(
                    label_info['raw_label'],
                    label_info['count'],
                    label_info['components']
                )
                
                canonical_labels[canonical] = {
                    'count': label_info['count'],
                    'raw_labels': [label_info['raw_label']],
                    'strategy': strategy
                }
                
                mapping_records.append({
                    'raw_label': label_info['raw_label'],
                    'canonical_label': canonical,
                    'count': label_info['count'],
                    'confidence': confidence,
                    'merge_reason': reason
                })
                
                decisions.append({
                    'group': group_key,
                    'decision': 'Keep as-is',
                    'canonical': canonical,
                    'count': label_info['count'],
                    'reason': 'Single label in group'
                })
        
        self.canonical_taxonomy = canonical_labels
        self.mapping_records = mapping_records
        self.taxonomy_decisions = decisions
        
        print(f"\n[✓] Created canonical taxonomy with {len(canonical_labels)} classes")
        print(f"[✓] Generated {len(mapping_records)} mapping records")
        
        return canonical_labels
    
    def enrich_mappings_with_datasets(self):
        """Add dataset information to mapping records"""
        print("\n" + "="*70)
        print("STEP 4: ENRICHING MAPPINGS WITH DATASET INFO")
        print("="*70)
        
        enriched_mappings = []
        
        for record in self.mapping_records:
            raw_label = record['raw_label']
            
            # Find which datasets contain this label
            datasets_with_label = []
            for img_record in self.raw_labels:
                if img_record['raw_label'] == raw_label:
                    if img_record['dataset'] not in datasets_with_label:
                        datasets_with_label.append(img_record['dataset'])
            
            # Create enriched record
            enriched_record = record.copy()
            enriched_record['datasets'] = ', '.join(sorted(datasets_with_label))
            enriched_record['num_datasets'] = len(datasets_with_label)
            
            enriched_mappings.append(enriched_record)
        
        self.mapping_records = enriched_mappings
        print(f"[✓] Enriched {len(enriched_mappings)} mapping records")
        
        return enriched_mappings
    
    def handle_ambiguous_labels(self):
        """Apply hybrid approach to ambiguous/unknown labels"""
        print("\n" + "="*70)
        print("STEP 5: HANDLING AMBIGUOUS LABELS")
        print("="*70)
        
        ambiguous_mappings = []
        
        for record in self.mapping_records:
            is_ambiguous = False
            handling_strategy = None
            
            # Check for truly ambiguous labels
            if record['confidence'] == 'Low':
                raw_lower = record['raw_label'].lower()
                
                # Check if label is too generic
                if raw_lower in ['disease', 'infected', 'unhealthy', 'affected']:
                    is_ambiguous = True
                    handling_strategy = 'Map to Unknown (too generic)'
                    record['canonical_label'] = 'Unknown'
                
                # Check for conflicting information
                elif 'or' in raw_lower or '/' in raw_lower:
                    is_ambiguous = True
                    handling_strategy = 'Soft label (multiple possibilities)'
                    # Keep original canonical but mark for soft labeling
                    record['soft_label'] = True
                
                # Partial information available
                elif record['count'] >= self.min_samples_keep_class:
                    handling_strategy = 'Keep with low confidence (sufficient samples)'
                else:
                    is_ambiguous = True
                    handling_strategy = 'Map to Unknown (insufficient info and low count)'
                    record['canonical_label'] = 'Unknown'
            
            if is_ambiguous:
                record['ambiguous_handling'] = handling_strategy
                ambiguous_mappings.append(record)
        
        print(f"[✓] Identified {len(ambiguous_mappings)} ambiguous labels")
        
        # Save ambiguous labels report
        if ambiguous_mappings:
            ambiguous_path = self.output_dir / "ambiguous_labels_handling.csv"
            pd.DataFrame(ambiguous_mappings).to_csv(ambiguous_path, index=False)
            print(f"[✓] Saved ambiguous labels report: {ambiguous_path}")
        
        return ambiguous_mappings
    
    def save_outputs(self):
        """Save all taxonomy outputs"""
        print("\n" + "="*70)
        print("STEP 6: SAVING OUTPUTS")
        print("="*70)
        
        # 1. Canonical Taxonomy
        taxonomy_records = []
        for canonical, info in self.canonical_taxonomy.items():
            taxonomy_records.append({
                'Canonical Label': canonical,
                'Total Count': info['count'],
                'Number of Raw Labels': len(info['raw_labels']),
                'Strategy': info['strategy'],
                'Raw Labels': ', '.join(info['raw_labels'][:5]) + ('...' if len(info['raw_labels']) > 5 else '')
            })
        
        taxonomy_df = pd.DataFrame(taxonomy_records)
        taxonomy_df = taxonomy_df.sort_values('Total Count', ascending=False)
        
        taxonomy_path = self.output_dir / "canonical_taxonomy.csv"
        taxonomy_df.to_csv(taxonomy_path, index=False)
        print(f"✓ Saved canonical taxonomy: {taxonomy_path}")
        
        # 2. Raw to Canonical Mapping
        mapping_df = pd.DataFrame(self.mapping_records)
        mapping_df = mapping_df.sort_values(['canonical_label', 'count'], ascending=[True, False])
        
        # Reorder columns
        column_order = ['raw_label', 'canonical_label', 'count', 'confidence', 
                       'merge_reason', 'datasets', 'num_datasets']
        mapping_df = mapping_df[[col for col in column_order if col in mapping_df.columns]]
        
        mapping_path = self.output_dir / "raw_to_canonical_mapping.csv"
        mapping_df.to_csv(mapping_path, index=False)
        print(f"✓ Saved label mapping: {mapping_path}")
        
        # 3. Label Conflicts
        if self.conflicts:
            conflicts_df = pd.DataFrame(self.conflicts)
            conflicts_df = conflicts_df.sort_values('Similarity', ascending=False)
            
            conflicts_path = self.output_dir / "automatic_label_conflicts.csv"
            conflicts_df.to_csv(conflicts_path, index=False)
            print(f"✓ Saved conflict report: {conflicts_path}")
        
        # 4. Taxonomy Decisions Log
        decisions_df = pd.DataFrame(self.taxonomy_decisions)
        decisions_df = decisions_df.sort_values('count', ascending=False)
        
        decisions_path = self.output_dir / "taxonomy_decisions_log.csv"
        decisions_df.to_csv(decisions_path, index=False)
        print(f"✓ Saved decisions log: {decisions_path}")
        
        # 5. Taxonomy Rationale Report
        self._generate_rationale_report()
        
        print(f"\n[✓] All outputs saved to: {self.output_dir}")
    
    def _generate_rationale_report(self):
        """Generate human-readable rationale report"""
        report_lines = []
        report_lines.append("=" * 80)
        report_lines.append("LABEL TAXONOMY DESIGN RATIONALE REPORT")
        report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 80)
        
        report_lines.append("\n## OVERVIEW")
        report_lines.append(f"Total Raw Labels: {len(self.label_counts)}")
        report_lines.append(f"Total Canonical Classes: {len(self.canonical_taxonomy)}")
        report_lines.append(f"Total Images: {len(self.raw_labels)}")
        report_lines.append(f"Label Conflicts Detected: {len(self.conflicts)}")
        
        report_lines.append("\n## TAXONOMY STRATEGY")
        report_lines.append(f"Fine-grained threshold: {self.min_samples_fine_grained} samples")
        report_lines.append(f"Minimum class size: {self.min_samples_keep_class} samples")
        report_lines.append("Naming convention: PascalCase")
        report_lines.append("Healthy handling: Separate 'Healthy' class + optional binary pre-filter")
        
        report_lines.append("\n## CANONICAL CLASSES (Top 20 by count)")
        sorted_classes = sorted(
            self.canonical_taxonomy.items(),
            key=lambda x: x[1]['count'],
            reverse=True
        )
        for i, (canonical, info) in enumerate(sorted_classes[:20], 1):
            report_lines.append(
                f"{i:2d}. {canonical:40s} - {info['count']:6d} images "
                f"({len(info['raw_labels'])} raw labels, {info['strategy']})"
            )
        
        report_lines.append("\n## MERGE DECISIONS")
        
        # Count decision types
        decision_counts = Counter(d['decision'] for d in self.taxonomy_decisions)
        for decision_type, count in decision_counts.most_common():
            report_lines.append(f"{decision_type}: {count} groups")
        
        report_lines.append("\n## DETAILED MERGE EXAMPLES")
        
        # Show examples of each decision type
        coarse_examples = [d for d in self.taxonomy_decisions if d['decision'] == 'Merge to coarse'][:5]
        if coarse_examples:
            report_lines.append("\nCoarse-Grained Merges (Examples):")
            for ex in coarse_examples:
                report_lines.append(f"  • {ex['canonical']} ({ex['count']} samples)")
                report_lines.append(f"    Reason: {ex['reason']}")
        
        fine_examples = [d for d in self.taxonomy_decisions if d['decision'] == 'Keep fine-grained'][:5]
        if fine_examples:
            report_lines.append("\nFine-Grained Retained (Examples):")
            for ex in fine_examples:
                report_lines.append(f"  • {ex['canonical']} ({ex['count']} samples)")
                report_lines.append(f"    Reason: {ex['reason']}")
        
        report_lines.append("\n## HEALTHY CLASS HANDLING")
        healthy_classes = [c for c in self.canonical_taxonomy.keys() if 'healthy' in c.lower()]
        if healthy_classes:
            for h_class in healthy_classes:
                count = self.canonical_taxonomy[h_class]['count']
                report_lines.append(f"  • {h_class}: {count} images")
            report_lines.append("\nStrategy: Use 'Healthy' as canonical class")
            report_lines.append("Optional: Deploy as stage-1 binary filter (Healthy/Diseased)")
            report_lines.append("Then: Multi-class disease classification on diseased images")
        
        report_lines.append("\n## AMBIGUOUS LABEL HANDLING")
        ambiguous_count = sum(1 for r in self.mapping_records if r.get('ambiguous_handling'))
        report_lines.append(f"Ambiguous labels found: {ambiguous_count}")
        report_lines.append("Strategy:")
        report_lines.append("  • Truly generic → 'Unknown' class")
        report_lines.append("  • Multiple possibilities → Soft labeling")
        report_lines.append("  • Partial info + sufficient data → Keep with low confidence")
        report_lines.append("  • Unusable/contradictory → Exclude from training")
        
        report_lines.append("\n## LABEL CONFLICTS")
        if self.conflicts:
            high_conflicts = [c for c in self.conflicts if c['Similarity'] >= 85]
            report_lines.append(f"High-similarity conflicts (≥85%): {len(high_conflicts)}")
            report_lines.append("\nTop conflicts requiring review:")
            for conflict in sorted(self.conflicts, key=lambda x: x['Similarity'], reverse=True)[:10]:
                report_lines.append(
                    f"  • '{conflict['Label 1']}' vs '{conflict['Label 2']}' "
                    f"({conflict['Similarity']}% similar)"
                )
                report_lines.append(f"    Type: {conflict['Conflict Type']}")
        
        report_lines.append("\n## RECOMMENDATIONS")
        report_lines.append("1. Review high-similarity conflicts in automatic_label_conflicts.csv")
        report_lines.append("2. Manually verify low-confidence mappings")
        report_lines.append("3. Consider data augmentation for classes with <100 samples")
        report_lines.append("4. Implement hierarchical classification if needed")
        report_lines.append("5. Use canonical labels for all model training")
        report_lines.append("6. Maintain mapping file for dataset updates")
        
        report_lines.append("\n## OUTPUT FILES")
        report_lines.append("  • canonical_taxonomy.csv - Final class taxonomy")
        report_lines.append("  • raw_to_canonical_mapping.csv - Complete label mapping")
        report_lines.append("  • automatic_label_conflicts.csv - Conflicts for review")
        report_lines.append("  • taxonomy_decisions_log.csv - Decision audit trail")
        report_lines.append("  • ambiguous_labels_handling.csv - Ambiguous label strategies")
        report_lines.append("  • taxonomy_rationale_report.txt - This document")
        
        report_lines.append("\n" + "=" * 80)
        report_lines.append("END OF REPORT")
        report_lines.append("=" * 80)
        
        # Save report
        report_path = self.output_dir / "taxonomy_rationale_report.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
        
        print(f"✓ Saved rationale report: {report_path}")
        
        # Also print to console
        print("\n" + '\n'.join(report_lines))
    
    def run_full_taxonomy_design(self):
        """Run complete taxonomy design workflow"""
        print("\n" + "🏗️" * 35)
        print("LABEL TAXONOMY DESIGNER - FULL WORKFLOW")
        print("🏗️" * 35)
        
        # Run all steps
        self.extract_all_labels()
        self.detect_label_conflicts()
        self.create_canonical_taxonomy()
        self.enrich_mappings_with_datasets()
        self.handle_ambiguous_labels()
        self.save_outputs()
        
        print("\n" + "✓" * 70)
        print("TAXONOMY DESIGN COMPLETE!")
        print("✓" * 70)
        print(f"\nAll outputs saved to: {self.output_dir}")
        print(f"\nCanonical classes: {len(self.canonical_taxonomy)}")
        print(f"Total mappings: {len(self.mapping_records)}")
        print(f"Conflicts detected: {len(self.conflicts)}")
        
        return self.output_dir


def main():
    """Main execution function"""
    # Configuration
    DATASETS_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\myDatasets"
    OUTPUT_DIR = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\taxonomy_output"
    MIN_SAMPLES_FINE_GRAINED = 100  # Threshold for keeping fine-grained labels
    
    # Create taxonomy designer
    designer = LabelTaxonomyDesigner(
        DATASETS_ROOT, 
        OUTPUT_DIR,
        min_samples_fine_grained=MIN_SAMPLES_FINE_GRAINED
    )
    
    # Run full workflow
    output_dir = designer.run_full_taxonomy_design()
    
    print(f"\n✅ Label taxonomy design complete!")
    print(f"📁 Check output folder: {output_dir}")
    print(f"\n📋 Next steps:")
    print("   1. Review canonical_taxonomy.csv")
    print("   2. Check automatic_label_conflicts.csv for conflicts")
    print("   3. Verify raw_to_canonical_mapping.csv")
    print("   4. Read taxonomy_rationale_report.txt for decisions")
    print("   5. Use canonical labels for dataset reorganization")


if __name__ == "__main__":
    main()
