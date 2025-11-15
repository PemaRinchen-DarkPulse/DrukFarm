"""
Dataset Curator and Analysis Tool for Plant Disease Detection
Performs comprehensive inventory, quality assessment, and duplicate detection
across multiple plant disease datasets.
"""

import os
import csv
import json
import hashlib
import shutil
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime
import numpy as np
import pandas as pd
from PIL import Image
import cv2
import imagehash
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')


class DatasetCurator:
    """Main class for dataset inventory and analysis"""
    
    def __init__(self, datasets_root, output_dir="dataset_analysis_output"):
        self.datasets_root = Path(datasets_root)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Output subdirectories
        self.manifests_dir = self.output_dir / "manifests"
        self.statistics_dir = self.output_dir / "statistics"
        self.duplicates_dir = self.output_dir / "duplicates"
        self.samples_dir = self.output_dir / "manual_inspection_samples"
        self.reports_dir = self.output_dir / "reports"
        
        for d in [self.manifests_dir, self.statistics_dir, 
                  self.duplicates_dir, self.samples_dir, self.reports_dir]:
            d.mkdir(exist_ok=True)
        
        # Data structures
        self.datasets = []
        self.all_images = []
        self.md5_hashes = {}
        self.perceptual_hashes = {}
        self.class_labels = defaultdict(list)
        self.label_conflicts = []
        self.quality_issues = []
        
        # Image extensions
        self.image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        
        print(f"[✓] Dataset Curator initialized")
        print(f"[✓] Datasets root: {self.datasets_root}")
        print(f"[✓] Output directory: {self.output_dir}")
    
    def scan_datasets(self):
        """Scan all datasets in the root folder"""
        print("\n" + "="*70)
        print("STEP 1: SCANNING ALL DATASETS")
        print("="*70)
        
        dataset_folders = [f for f in self.datasets_root.iterdir() if f.is_dir()]
        print(f"Found {len(dataset_folders)} potential datasets")
        
        for dataset_folder in dataset_folders:
            print(f"\n📁 Scanning: {dataset_folder.name}")
            dataset_info = self._analyze_dataset_structure(dataset_folder)
            
            if dataset_info['image_count'] > 0:
                self.datasets.append(dataset_info)
                print(f"   ✓ Images: {dataset_info['image_count']}, Classes: {len(dataset_info['classes'])}")
            else:
                print(f"   ⚠ No images found - skipping")
        
        print(f"\n[✓] Total datasets analyzed: {len(self.datasets)}")
        return self.datasets
    
    def _analyze_dataset_structure(self, dataset_path):
        """Analyze individual dataset structure"""
        dataset_info = {
            'name': dataset_path.name,
            'path': str(dataset_path),
            'image_count': 0,
            'classes': [],
            'formats': set(),
            'structure_type': 'unknown',
            'images': []
        }
        
        # Scan for images recursively
        images = []
        for ext in self.image_extensions:
            images.extend(dataset_path.rglob(f"*{ext}"))
        
        dataset_info['image_count'] = len(images)
        
        # Determine structure and extract labels
        class_labels = set()
        
        for img_path in images:
            # Try to extract label from folder structure
            relative_path = img_path.relative_to(dataset_path)
            parts = relative_path.parts
            
            # Common patterns: class/image.jpg or train/class/image.jpg
            label = None
            if len(parts) >= 2:
                # Check if parent folder looks like a class label
                potential_label = parts[-2]
                if not potential_label.lower() in ['train', 'test', 'val', 'validation', 'images']:
                    label = potential_label
                elif len(parts) >= 3:
                    label = parts[-3]
            
            if label:
                class_labels.add(label)
            
            # Get image metadata
            img_info = self._get_image_metadata(img_path, label, dataset_info['name'])
            dataset_info['images'].append(img_info)
            self.all_images.append(img_info)
            dataset_info['formats'].add(img_path.suffix.lower())
        
        dataset_info['classes'] = sorted(list(class_labels))
        dataset_info['formats'] = sorted(list(dataset_info['formats']))
        
        return dataset_info
    
    def _get_image_metadata(self, img_path, label, dataset_name):
        """Extract metadata from a single image"""
        metadata = {
            'path': str(img_path),
            'dataset': dataset_name,
            'label': label,
            'filename': img_path.name,
            'format': img_path.suffix.lower(),
            'size_bytes': 0,
            'width': 0,
            'height': 0,
            'channels': 0,
            'color_mode': 'unknown',
            'readable': False,
            'md5': None,
            'phash': None
        }
        
        try:
            # File size
            metadata['size_bytes'] = img_path.stat().st_size
            
            # Image properties
            with Image.open(img_path) as img:
                metadata['width'], metadata['height'] = img.size
                metadata['color_mode'] = img.mode
                metadata['channels'] = len(img.getbands())
                metadata['readable'] = True
                
                # Compute MD5 hash
                img_bytes = img_path.read_bytes()
                metadata['md5'] = hashlib.md5(img_bytes).hexdigest()
                
                # Compute perceptual hash
                metadata['phash'] = str(imagehash.average_hash(img))
        
        except Exception as e:
            metadata['error'] = str(e)
        
        return metadata
    
    def generate_manifests(self):
        """Generate CSV manifests for each dataset"""
        print("\n" + "="*70)
        print("STEP 2: GENERATING DATASET MANIFESTS")
        print("="*70)
        
        master_manifest = []
        
        for dataset in self.datasets:
            print(f"\n📝 Creating manifest for: {dataset['name']}")
            
            # Dataset-level manifest
            manifest_data = {
                'Dataset Name': dataset['name'],
                'Source Folder': dataset['path'],
                'Total Images': dataset['image_count'],
                'Number of Classes': len(dataset['classes']),
                'Classes': ', '.join(dataset['classes'][:10]) + ('...' if len(dataset['classes']) > 10 else ''),
                'Image Formats': ', '.join(dataset['formats']),
                'Structure Type': dataset['structure_type']
            }
            
            # Calculate resolution stats
            widths = [img['width'] for img in dataset['images'] if img['readable']]
            heights = [img['height'] for img in dataset['images'] if img['readable']]
            
            if widths and heights:
                manifest_data['Min Resolution'] = f"{min(widths)}x{min(heights)}"
                manifest_data['Max Resolution'] = f"{max(widths)}x{max(heights)}"
                manifest_data['Median Resolution'] = f"{int(np.median(widths))}x{int(np.median(heights))}"
            
            master_manifest.append(manifest_data)
            
            # Image-level manifest
            img_manifest_path = self.manifests_dir / f"{dataset['name']}_images.csv"
            with open(img_manifest_path, 'w', newline='', encoding='utf-8') as f:
                if dataset['images']:
                    fieldnames = ['filename', 'label', 'format', 'width', 'height', 
                                'color_mode', 'size_bytes', 'readable', 'path']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for img in dataset['images']:
                        writer.writerow({
                            'filename': img['filename'],
                            'label': img['label'],
                            'format': img['format'],
                            'width': img['width'],
                            'height': img['height'],
                            'color_mode': img['color_mode'],
                            'size_bytes': img['size_bytes'],
                            'readable': img['readable'],
                            'path': img['path']
                        })
            
            print(f"   ✓ Saved image manifest: {img_manifest_path.name}")
        
        # Save master manifest
        master_path = self.manifests_dir / "master_manifest.csv"
        df = pd.DataFrame(master_manifest)
        df.to_csv(master_path, index=False)
        print(f"\n[✓] Master manifest saved: {master_path}")
        
        return master_manifest
    
    def compute_statistics(self):
        """Compute detailed statistics for all datasets"""
        print("\n" + "="*70)
        print("STEP 3: COMPUTING DATASET STATISTICS")
        print("="*70)
        
        # Overall statistics
        total_images = len(self.all_images)
        readable_images = sum(1 for img in self.all_images if img['readable'])
        
        print(f"\nTotal images across all datasets: {total_images}")
        print(f"Readable images: {readable_images}")
        print(f"Corrupted/unreadable: {total_images - readable_images}")
        
        # Class distribution across all datasets
        class_distribution = defaultdict(lambda: {'count': 0, 'datasets': set()})
        
        for img in self.all_images:
            if img['label']:
                class_distribution[img['label']]['count'] += 1
                class_distribution[img['label']]['datasets'].add(img['dataset'])
        
        # Save class distribution
        class_stats = []
        for label, info in sorted(class_distribution.items(), key=lambda x: x[1]['count'], reverse=True):
            class_stats.append({
                'Class Label': label,
                'Total Images': info['count'],
                'Number of Datasets': len(info['datasets']),
                'Datasets': ', '.join(sorted(info['datasets']))
            })
        
        class_stats_path = self.statistics_dir / "class_distribution.csv"
        pd.DataFrame(class_stats).to_csv(class_stats_path, index=False)
        print(f"\n[✓] Class distribution saved: {class_stats_path}")
        
        # Resolution statistics
        resolution_stats = []
        readable = [img for img in self.all_images if img['readable']]
        
        for dataset in self.datasets:
            dataset_imgs = [img for img in dataset['images'] if img['readable']]
            if dataset_imgs:
                widths = [img['width'] for img in dataset_imgs]
                heights = [img['height'] for img in dataset_imgs]
                sizes = [img['size_bytes'] for img in dataset_imgs]
                
                resolution_stats.append({
                    'Dataset': dataset['name'],
                    'Images': len(dataset_imgs),
                    'Min Width': min(widths),
                    'Max Width': max(widths),
                    'Median Width': int(np.median(widths)),
                    'Min Height': min(heights),
                    'Max Height': max(heights),
                    'Median Height': int(np.median(heights)),
                    'Min Size (KB)': min(sizes) // 1024,
                    'Max Size (KB)': max(sizes) // 1024,
                    'Avg Size (KB)': sum(sizes) // len(sizes) // 1024
                })
        
        res_stats_path = self.statistics_dir / "resolution_statistics.csv"
        pd.DataFrame(resolution_stats).to_csv(res_stats_path, index=False)
        print(f"[✓] Resolution statistics saved: {res_stats_path}")
        
        # Color mode distribution
        color_modes = Counter(img['color_mode'] for img in readable)
        color_path = self.statistics_dir / "color_mode_distribution.csv"
        pd.DataFrame([
            {'Color Mode': mode, 'Count': count} 
            for mode, count in color_modes.most_common()
        ]).to_csv(color_path, index=False)
        print(f"[✓] Color mode distribution saved: {color_path}")
        
        return class_stats
    
    def detect_duplicates(self):
        """Detect duplicate images using MD5 and perceptual hashing"""
        print("\n" + "="*70)
        print("STEP 4: DETECTING DUPLICATES")
        print("="*70)
        
        md5_duplicates = defaultdict(list)
        phash_duplicates = defaultdict(list)
        
        print("\nIndexing images by MD5 hash...")
        for img in tqdm(self.all_images, desc="MD5 Hashing"):
            if img['md5']:
                md5_duplicates[img['md5']].append(img)
        
        print("Indexing images by perceptual hash...")
        for img in tqdm(self.all_images, desc="Perceptual Hashing"):
            if img['phash']:
                phash_duplicates[img['phash']].append(img)
        
        # Find exact duplicates (MD5)
        exact_dups = {k: v for k, v in md5_duplicates.items() if len(v) > 1}
        print(f"\n[✓] Found {len(exact_dups)} exact duplicate groups (MD5)")
        
        # Find near duplicates (perceptual hash)
        near_dups = {k: v for k, v in phash_duplicates.items() if len(v) > 1}
        print(f"[✓] Found {len(near_dups)} near-duplicate groups (perceptual hash)")
        
        # Save exact duplicates
        exact_dup_records = []
        for hash_val, images in exact_dups.items():
            for i, img in enumerate(images):
                exact_dup_records.append({
                    'Duplicate Group': hash_val[:12],
                    'Image Index': i + 1,
                    'Total in Group': len(images),
                    'Dataset': img['dataset'],
                    'Label': img['label'],
                    'Filename': img['filename'],
                    'Path': img['path'],
                    'Size (KB)': img['size_bytes'] // 1024
                })
        
        exact_path = self.duplicates_dir / "exact_duplicates_md5.csv"
        pd.DataFrame(exact_dup_records).to_csv(exact_path, index=False)
        print(f"[✓] Exact duplicates saved: {exact_path}")
        
        # Save near duplicates
        near_dup_records = []
        for hash_val, images in near_dups.items():
            # Filter out those already in exact duplicates
            md5_set = {img['md5'] for img in images}
            if len(md5_set) > 1:  # Only if they're not exact duplicates
                for i, img in enumerate(images):
                    near_dup_records.append({
                        'Duplicate Group': hash_val,
                        'Image Index': i + 1,
                        'Total in Group': len(images),
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Filename': img['filename'],
                        'Path': img['path'],
                        'Resolution': f"{img['width']}x{img['height']}"
                    })
        
        near_path = self.duplicates_dir / "near_duplicates_phash.csv"
        pd.DataFrame(near_dup_records).to_csv(near_path, index=False)
        print(f"[✓] Near duplicates saved: {near_path}")
        
        return exact_dups, near_dups
    
    def analyze_label_semantics(self):
        """Analyze label consistency and find potential conflicts"""
        print("\n" + "="*70)
        print("STEP 5: ANALYZING LABEL SEMANTICS")
        print("="*70)
        
        # Collect all unique labels
        all_labels = set()
        for img in self.all_images:
            if img['label']:
                all_labels.add(img['label'].lower())
        
        print(f"\nTotal unique labels (case-insensitive): {len(all_labels)}")
        
        # Find similar labels (potential conflicts)
        conflicts = []
        label_list = sorted(all_labels)
        
        # Common disease/condition keywords
        keywords = ['blight', 'spot', 'rust', 'rot', 'mold', 'mildew', 'wilt', 
                   'mosaic', 'curl', 'scorch', 'healthy', 'disease', 'leaf']
        
        # Group labels by keywords
        keyword_groups = defaultdict(list)
        for label in label_list:
            for keyword in keywords:
                if keyword in label:
                    keyword_groups[keyword].append(label)
        
        # Check for potential conflicts
        for keyword, labels in keyword_groups.items():
            if len(labels) > 1:
                conflicts.append({
                    'Keyword': keyword,
                    'Variant Count': len(labels),
                    'Label Variants': ', '.join(sorted(labels))
                })
        
        conflicts_path = self.statistics_dir / "label_conflicts.csv"
        pd.DataFrame(conflicts).to_csv(conflicts_path, index=False)
        print(f"[✓] Label conflicts saved: {conflicts_path}")
        
        # Create label mapping suggestions
        label_mapping = []
        for label in sorted(all_labels):
            # Normalize label
            normalized = label.lower().replace('_', ' ').replace('-', ' ')
            words = normalized.split()
            
            label_mapping.append({
                'Original Label': label,
                'Normalized': normalized,
                'Word Count': len(words),
                'Contains Digits': any(c.isdigit() for c in label)
            })
        
        mapping_path = self.statistics_dir / "label_mapping.csv"
        pd.DataFrame(label_mapping).to_csv(mapping_path, index=False)
        print(f"[✓] Label mapping saved: {mapping_path}")
        
        return conflicts
    
    def assess_quality(self):
        """Assess image quality and identify potential issues"""
        print("\n" + "="*70)
        print("STEP 6: ASSESSING IMAGE QUALITY")
        print("="*70)
        
        quality_issues = []
        
        print("\nAnalyzing image quality metrics...")
        
        for img in tqdm(self.all_images[:1000], desc="Quality Check"):  # Sample first 1000
            if not img['readable']:
                quality_issues.append({
                    'Issue Type': 'Unreadable',
                    'Dataset': img['dataset'],
                    'Label': img['label'],
                    'Path': img['path'],
                    'Details': img.get('error', 'Unknown error')
                })
                continue
            
            try:
                # Load image for quality checks
                img_cv = cv2.imread(img['path'])
                
                if img_cv is None:
                    continue
                
                # Check for very small images
                if img['width'] < 50 or img['height'] < 50:
                    quality_issues.append({
                        'Issue Type': 'Too Small',
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Path': img['path'],
                        'Details': f"{img['width']}x{img['height']}"
                    })
                
                # Check for very large images
                if img['width'] > 5000 or img['height'] > 5000:
                    quality_issues.append({
                        'Issue Type': 'Very Large',
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Path': img['path'],
                        'Details': f"{img['width']}x{img['height']}"
                    })
                
                # Check for extreme aspect ratios
                aspect_ratio = img['width'] / img['height'] if img['height'] > 0 else 0
                if aspect_ratio > 5 or aspect_ratio < 0.2:
                    quality_issues.append({
                        'Issue Type': 'Extreme Aspect Ratio',
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Path': img['path'],
                        'Details': f"Ratio: {aspect_ratio:.2f}"
                    })
                
                # Check brightness (simple check)
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                mean_brightness = np.mean(gray)
                
                if mean_brightness < 20:
                    quality_issues.append({
                        'Issue Type': 'Too Dark',
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Path': img['path'],
                        'Details': f"Mean brightness: {mean_brightness:.1f}"
                    })
                elif mean_brightness > 235:
                    quality_issues.append({
                        'Issue Type': 'Too Bright',
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Path': img['path'],
                        'Details': f"Mean brightness: {mean_brightness:.1f}"
                    })
                
                # Check for blur using Laplacian variance
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                if laplacian_var < 100:
                    quality_issues.append({
                        'Issue Type': 'Potentially Blurry',
                        'Dataset': img['dataset'],
                        'Label': img['label'],
                        'Path': img['path'],
                        'Details': f"Laplacian variance: {laplacian_var:.1f}"
                    })
            
            except Exception as e:
                quality_issues.append({
                    'Issue Type': 'Analysis Error',
                    'Dataset': img['dataset'],
                    'Label': img['label'],
                    'Path': img['path'],
                    'Details': str(e)
                })
        
        quality_path = self.statistics_dir / "quality_issues.csv"
        pd.DataFrame(quality_issues).to_csv(quality_path, index=False)
        print(f"\n[✓] Quality issues saved: {quality_path}")
        print(f"[✓] Total issues found: {len(quality_issues)}")
        
        return quality_issues
    
    def export_manual_inspection_samples(self, samples_per_class=20):
        """Export sample images for manual inspection"""
        print("\n" + "="*70)
        print("STEP 7: EXPORTING MANUAL INSPECTION SAMPLES")
        print("="*70)
        
        # Group images by label
        images_by_label = defaultdict(list)
        for img in self.all_images:
            if img['label'] and img['readable']:
                images_by_label[img['label']].append(img)
        
        print(f"\nExporting up to {samples_per_class} samples per class...")
        
        exported_count = 0
        sample_manifest = []
        
        for label, images in tqdm(images_by_label.items(), desc="Exporting samples"):
            # Create class folder
            class_folder = self.samples_dir / label
            class_folder.mkdir(exist_ok=True)
            
            # Sample images (stratified across datasets if possible)
            datasets_in_class = defaultdict(list)
            for img in images:
                datasets_in_class[img['dataset']].append(img)
            
            samples = []
            # Try to get samples from different datasets
            for dataset, imgs in datasets_in_class.items():
                n_samples = min(samples_per_class // len(datasets_in_class), len(imgs))
                samples.extend(np.random.choice(imgs, n_samples, replace=False))
            
            # Fill up to samples_per_class if needed
            if len(samples) < samples_per_class:
                remaining = samples_per_class - len(samples)
                available = [img for img in images if img not in samples]
                if available:
                    additional = np.random.choice(available, 
                                                 min(remaining, len(available)), 
                                                 replace=False)
                    samples.extend(additional)
            
            # Copy samples
            for i, img in enumerate(samples[:samples_per_class]):
                src_path = Path(img['path'])
                dst_filename = f"{i+1:03d}_{img['dataset'][:20]}_{src_path.name}"
                dst_path = class_folder / dst_filename
                
                try:
                    shutil.copy2(src_path, dst_path)
                    exported_count += 1
                    
                    sample_manifest.append({
                        'Class': label,
                        'Sample Index': i + 1,
                        'Original Dataset': img['dataset'],
                        'Original Path': img['path'],
                        'Exported Path': str(dst_path),
                        'Resolution': f"{img['width']}x{img['height']}"
                    })
                except Exception as e:
                    print(f"   Error copying {src_path}: {e}")
        
        # Save manifest
        manifest_path = self.samples_dir / "sample_manifest.csv"
        pd.DataFrame(sample_manifest).to_csv(manifest_path, index=False)
        
        print(f"\n[✓] Exported {exported_count} sample images")
        print(f"[✓] Sample manifest saved: {manifest_path}")
        
        return exported_count
    
    def generate_health_report(self):
        """Generate comprehensive dataset health report"""
        print("\n" + "="*70)
        print("STEP 8: GENERATING DATASET HEALTH REPORT")
        print("="*70)
        
        report_lines = []
        report_lines.append("=" * 80)
        report_lines.append("PLANT DISEASE DATASET HEALTH REPORT")
        report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 80)
        
        # Overall summary
        report_lines.append("\n## OVERALL SUMMARY")
        report_lines.append(f"Total Datasets: {len(self.datasets)}")
        report_lines.append(f"Total Images: {len(self.all_images)}")
        
        readable = sum(1 for img in self.all_images if img['readable'])
        report_lines.append(f"Readable Images: {readable} ({readable/len(self.all_images)*100:.1f}%)")
        
        # Labels summary
        all_labels = set(img['label'] for img in self.all_images if img['label'])
        report_lines.append(f"Total Unique Labels: {len(all_labels)}")
        
        # Dataset details
        report_lines.append("\n## DATASET DETAILS")
        for i, dataset in enumerate(self.datasets, 1):
            report_lines.append(f"\n{i}. {dataset['name']}")
            report_lines.append(f"   Images: {dataset['image_count']}")
            report_lines.append(f"   Classes: {len(dataset['classes'])}")
            report_lines.append(f"   Formats: {', '.join(dataset['formats'])}")
        
        # Class distribution
        report_lines.append("\n## CLASS DISTRIBUTION (Top 20)")
        class_counts = Counter(img['label'] for img in self.all_images if img['label'])
        for label, count in class_counts.most_common(20):
            report_lines.append(f"   {label}: {count}")
        
        # Quality summary
        report_lines.append("\n## QUALITY ASSESSMENT")
        
        # Resolution stats
        readable_imgs = [img for img in self.all_images if img['readable']]
        if readable_imgs:
            widths = [img['width'] for img in readable_imgs]
            heights = [img['height'] for img in readable_imgs]
            report_lines.append(f"Resolution Range: {min(widths)}x{min(heights)} to {max(widths)}x{max(heights)}")
            report_lines.append(f"Median Resolution: {int(np.median(widths))}x{int(np.median(heights))}")
        
        # File format distribution
        format_counts = Counter(img['format'] for img in self.all_images)
        report_lines.append("\nFormat Distribution:")
        for fmt, count in format_counts.most_common():
            report_lines.append(f"   {fmt}: {count} ({count/len(self.all_images)*100:.1f}%)")
        
        # Recommendations
        report_lines.append("\n## RECOMMENDATIONS")
        report_lines.append("1. Review label conflicts in statistics/label_conflicts.csv")
        report_lines.append("2. Inspect duplicate images in duplicates/ folder")
        report_lines.append("3. Manually review samples in manual_inspection_samples/")
        report_lines.append("4. Address quality issues listed in statistics/quality_issues.csv")
        report_lines.append("5. Standardize label naming conventions across datasets")
        report_lines.append("6. Consider resolution normalization (target median resolution)")
        report_lines.append("7. Remove or fix corrupted/unreadable images")
        
        # Output files summary
        report_lines.append("\n## OUTPUT FILES")
        report_lines.append("Manifests:")
        report_lines.append("   - manifests/master_manifest.csv")
        report_lines.append("   - manifests/*_images.csv (per dataset)")
        report_lines.append("\nStatistics:")
        report_lines.append("   - statistics/class_distribution.csv")
        report_lines.append("   - statistics/resolution_statistics.csv")
        report_lines.append("   - statistics/color_mode_distribution.csv")
        report_lines.append("   - statistics/label_conflicts.csv")
        report_lines.append("   - statistics/label_mapping.csv")
        report_lines.append("   - statistics/quality_issues.csv")
        report_lines.append("\nDuplicates:")
        report_lines.append("   - duplicates/exact_duplicates_md5.csv")
        report_lines.append("   - duplicates/near_duplicates_phash.csv")
        report_lines.append("\nSamples:")
        report_lines.append("   - manual_inspection_samples/ (organized by class)")
        
        report_lines.append("\n" + "=" * 80)
        report_lines.append("END OF REPORT")
        report_lines.append("=" * 80)
        
        # Save report
        report_path = self.reports_dir / "dataset_health_report.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
        
        print(f"\n[✓] Health report saved: {report_path}")
        
        # Also print to console
        print("\n" + '\n'.join(report_lines))
        
        return report_path
    
    def run_full_analysis(self):
        """Run complete dataset curation workflow"""
        print("\n" + "🌿" * 35)
        print("PLANT DISEASE DATASET CURATOR - FULL ANALYSIS")
        print("🌿" * 35)
        
        # Run all steps
        self.scan_datasets()
        self.generate_manifests()
        self.compute_statistics()
        self.detect_duplicates()
        self.analyze_label_semantics()
        self.assess_quality()
        self.export_manual_inspection_samples()
        report_path = self.generate_health_report()
        
        print("\n" + "✓" * 70)
        print("ANALYSIS COMPLETE!")
        print("✓" * 70)
        print(f"\nAll outputs saved to: {self.output_dir}")
        print(f"Health report: {report_path}")
        
        return self.output_dir


def main():
    """Main execution function"""
    # Configuration
    DATASETS_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\myDatasets"
    OUTPUT_DIR = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\dataset_analysis_output"
    
    # Create curator instance
    curator = DatasetCurator(DATASETS_ROOT, OUTPUT_DIR)
    
    # Run full analysis
    output_dir = curator.run_full_analysis()
    
    print(f"\n✅ Dataset curation complete!")
    print(f"📁 Check output folder: {output_dir}")


if __name__ == "__main__":
    main()
