"""
Dataset Integration Engineer - Multi-Dataset Merger for Plant Disease Classification
Merges all datasets with deduplication, provenance tracking, and intelligent splitting.
"""

import os
import csv
import json
import hashlib
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
from PIL import Image
import cv2
from sklearn.cluster import DBSCAN
from sklearn.model_selection import StratifiedShuffleSplit
import imagehash


@dataclass
class ImageMetadata:
    """Complete metadata for a single image"""
    image_path: str
    canonical_class: str
    dataset_source: str
    original_path: str
    original_filename: str
    md5_hash: str
    perceptual_hash: str
    width: int
    height: int
    resolution: str
    aspect_ratio: float
    file_size: int
    format: str
    color_mode: str
    date_captured: Optional[str] = None
    device: Optional[str] = None
    location: Optional[str] = None
    plant_id: Optional[str] = None
    leaf_id: Optional[str] = None
    quality_score: float = 0.0
    is_augmented: bool = False
    
    
@dataclass
class ProvenanceEntry:
    """Provenance tracking for merged duplicates"""
    image_id: str
    dataset_source: str
    original_path: str
    original_filename: str
    md5_hash: str
    perceptual_hash: str
    kept: bool
    reason: str


class DatasetScanner:
    """Recursively scan and collect all images from datasets"""
    
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    
    def __init__(self, datasets_root: str):
        self.datasets_root = Path(datasets_root)
        self.image_records = []
        
    def scan_all_datasets(self) -> List[Dict]:
        """Scan all datasets and collect image metadata"""
        print("🔍 Scanning datasets...")
        
        # Iterate through each dataset folder
        for dataset_folder in self.datasets_root.iterdir():
            if dataset_folder.is_dir() and not dataset_folder.name.startswith('.'):
                print(f"  📁 Scanning: {dataset_folder.name}")
                self._scan_dataset(dataset_folder)
        
        print(f"✅ Found {len(self.image_records)} images across all datasets")
        return self.image_records
    
    def _scan_dataset(self, dataset_path: Path):
        """Scan a single dataset folder"""
        dataset_name = dataset_path.name
        
        # Recursively find all image files
        for img_path in dataset_path.rglob('*'):
            if img_path.is_file() and img_path.suffix.lower() in self.SUPPORTED_FORMATS:
                # Extract class label from directory structure
                canonical_class = self._extract_class_label(img_path, dataset_path)
                
                # Check if augmented
                is_augmented = self._is_augmented_image(img_path)
                
                record = {
                    'image_path': str(img_path),
                    'canonical_class': canonical_class,
                    'dataset_source': dataset_name,
                    'original_path': str(img_path.relative_to(self.datasets_root)),
                    'original_filename': img_path.name,
                    'is_augmented': is_augmented
                }
                
                self.image_records.append(record)
    
    def _extract_class_label(self, img_path: Path, dataset_root: Path) -> str:
        """Extract class label from directory structure"""
        # Get relative path from dataset root
        rel_path = img_path.relative_to(dataset_root)
        parts = rel_path.parts
        
        # Skip common split folders (train/val/test/valid)
        split_folders = {'train', 'val', 'valid', 'test', 'augmented dataset', 
                        'original dataset', 'part-1', 'part-2'}
        
        # Find the class label (usually parent folder)
        for i in range(len(parts) - 1, -1, -1):
            if parts[i].lower() not in split_folders and parts[i] != img_path.name:
                # Normalize class name
                class_name = parts[i].replace('_', ' ').replace('-', ' ')
                class_name = ' '.join(word.capitalize() for word in class_name.split())
                return class_name
        
        return "Unknown"
    
    def _is_augmented_image(self, img_path: Path) -> bool:
        """Detect if image is augmented based on path or filename"""
        path_str = str(img_path).lower()
        indicators = ['augmented', 'aug_', '_aug', 'rotated', 'flipped', 
                     'zoomed', 'shifted', 'brightness', 'contrast']
        return any(ind in path_str for ind in indicators)


class ImageAnalyzer:
    """Extract detailed metadata from images"""
    
    def __init__(self):
        self.cache = {}
    
    def analyze_image(self, img_path: str) -> Dict:
        """Extract comprehensive metadata from image"""
        if img_path in self.cache:
            return self.cache[img_path]
        
        try:
            # Compute MD5 hash
            md5_hash = self._compute_md5(img_path)
            
            # Open image with PIL
            with Image.open(img_path) as img:
                width, height = img.size
                format_name = img.format or 'Unknown'
                color_mode = img.mode
                
                # Compute perceptual hash
                p_hash = str(imagehash.phash(img))
                
                # Calculate quality score
                quality_score = self._calculate_quality_score(img, img_path)
            
            # File metadata
            file_size = os.path.getsize(img_path)
            
            metadata = {
                'md5_hash': md5_hash,
                'perceptual_hash': p_hash,
                'width': width,
                'height': height,
                'resolution': f"{width}x{height}",
                'aspect_ratio': round(width / height, 2) if height > 0 else 0,
                'file_size': file_size,
                'format': format_name,
                'color_mode': color_mode,
                'quality_score': quality_score
            }
            
            self.cache[img_path] = metadata
            return metadata
            
        except Exception as e:
            print(f"⚠️  Error analyzing {img_path}: {e}")
            return self._get_default_metadata()
    
    def _compute_md5(self, file_path: str) -> str:
        """Compute MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def _calculate_quality_score(self, img: Image.Image, img_path: str) -> float:
        """Calculate image quality score based on resolution and clarity"""
        width, height = img.size
        
        # Resolution score (0-40 points)
        total_pixels = width * height
        resolution_score = min(40, (total_pixels / 1_000_000) * 20)
        
        # Aspect ratio score (0-10 points) - penalize extreme ratios
        aspect_ratio = width / height if height > 0 else 1
        if 0.5 <= aspect_ratio <= 2.0:
            aspect_score = 10
        else:
            aspect_score = 5
        
        # Sharpness score (0-30 points) using Laplacian variance
        try:
            img_cv = cv2.imread(img_path)
            if img_cv is not None:
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                sharpness_score = min(30, (laplacian_var / 100) * 30)
            else:
                sharpness_score = 15
        except:
            sharpness_score = 15
        
        # File size score (0-20 points) - prefer reasonable file sizes
        file_size = os.path.getsize(img_path)
        if 50_000 <= file_size <= 5_000_000:  # 50KB to 5MB is good
            size_score = 20
        elif file_size < 50_000:
            size_score = 10
        else:
            size_score = 15
        
        total_score = resolution_score + aspect_score + sharpness_score + size_score
        return round(total_score, 2)
    
    def _get_default_metadata(self) -> Dict:
        """Return default metadata for failed analysis"""
        return {
            'md5_hash': 'unknown',
            'perceptual_hash': 'unknown',
            'width': 0,
            'height': 0,
            'resolution': '0x0',
            'aspect_ratio': 0,
            'file_size': 0,
            'format': 'Unknown',
            'color_mode': 'Unknown',
            'quality_score': 0.0
        }


class DeduplicationEngine:
    """Detect and handle duplicate images"""
    
    def __init__(self, perceptual_threshold: int = 5):
        self.perceptual_threshold = perceptual_threshold
        self.md5_groups = defaultdict(list)
        self.perceptual_groups = defaultdict(list)
        self.provenance_records = []
    
    def find_duplicates(self, metadata_list: List[ImageMetadata]) -> Tuple[List[ImageMetadata], List[ProvenanceEntry]]:
        """Find and resolve duplicates, keeping highest quality"""
        print("🔍 Detecting duplicates...")
        
        # Group by MD5 (exact duplicates)
        for meta in metadata_list:
            self.md5_groups[meta.md5_hash].append(meta)
        
        # Group by perceptual hash (near-duplicates)
        for meta in metadata_list:
            self.perceptual_groups[meta.perceptual_hash].append(meta)
        
        # Resolve duplicates
        unique_images = []
        duplicate_count = 0
        
        processed_md5 = set()
        
        for md5_hash, images in self.md5_groups.items():
            if md5_hash in processed_md5:
                continue
            
            if len(images) == 1:
                # No duplicates
                unique_images.append(images[0])
                self._add_provenance(images[0], kept=True, reason="unique")
            else:
                # Multiple exact duplicates - keep best quality
                best_image = max(images, key=lambda x: x.quality_score)
                unique_images.append(best_image)
                duplicate_count += len(images) - 1
                
                for img in images:
                    is_kept = (img == best_image)
                    reason = "best_quality" if is_kept else f"duplicate_of_{best_image.original_filename}"
                    self._add_provenance(img, kept=is_kept, reason=reason)
            
            processed_md5.add(md5_hash)
        
        # Check for perceptual duplicates among unique images
        unique_images = self._resolve_perceptual_duplicates(unique_images)
        
        print(f"✅ Removed {duplicate_count} exact duplicates")
        print(f"✅ Kept {len(unique_images)} unique images")
        
        return unique_images, self.provenance_records
    
    def _resolve_perceptual_duplicates(self, images: List[ImageMetadata]) -> List[ImageMetadata]:
        """Resolve near-duplicate images using perceptual hashing"""
        if len(images) <= 1:
            return images
        
        # Build perceptual hash groups
        p_hash_groups = defaultdict(list)
        for img in images:
            p_hash_groups[img.perceptual_hash].append(img)
        
        # Check hamming distance between similar hashes
        unique_images = []
        processed = set()
        
        for img in images:
            if img.image_path in processed:
                continue
            
            # Find similar images
            similar = [img]
            for other_img in images:
                if other_img.image_path != img.image_path and other_img.image_path not in processed:
                    distance = self._hamming_distance(img.perceptual_hash, other_img.perceptual_hash)
                    if distance <= self.perceptual_threshold:
                        similar.append(other_img)
            
            if len(similar) == 1:
                unique_images.append(img)
                processed.add(img.image_path)
            else:
                # Keep highest quality
                best = max(similar, key=lambda x: x.quality_score)
                unique_images.append(best)
                for s_img in similar:
                    processed.add(s_img.image_path)
        
        return unique_images
    
    def _hamming_distance(self, hash1: str, hash2: str) -> int:
        """Calculate hamming distance between two hashes"""
        if len(hash1) != len(hash2):
            return 100
        return sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
    
    def _add_provenance(self, img: ImageMetadata, kept: bool, reason: str):
        """Add provenance record"""
        entry = ProvenanceEntry(
            image_id=img.md5_hash,
            dataset_source=img.dataset_source,
            original_path=img.original_path,
            original_filename=img.original_filename,
            md5_hash=img.md5_hash,
            perceptual_hash=img.perceptual_hash,
            kept=kept,
            reason=reason
        )
        self.provenance_records.append(entry)


class SimilarityClusterer:
    """Group images by similarity when plant/leaf IDs are unavailable"""
    
    def __init__(self, eps: float = 0.3, min_samples: int = 2):
        self.eps = eps
        self.min_samples = min_samples
    
    def cluster_images(self, metadata_list: List[ImageMetadata]) -> Dict[str, int]:
        """Cluster images by perceptual similarity"""
        print("🔍 Clustering similar images...")
        
        if len(metadata_list) == 0:
            return {}
        
        # Convert perceptual hashes to binary vectors
        hash_vectors = []
        image_paths = []
        
        for meta in metadata_list:
            if meta.perceptual_hash != 'unknown':
                # Convert hex hash to binary vector
                binary = bin(int(meta.perceptual_hash, 16))[2:].zfill(64)
                vector = [int(bit) for bit in binary]
                hash_vectors.append(vector)
                image_paths.append(meta.image_path)
        
        if len(hash_vectors) == 0:
            return {}
        
        # Perform DBSCAN clustering
        hash_array = np.array(hash_vectors)
        clustering = DBSCAN(eps=self.eps, min_samples=self.min_samples, metric='hamming')
        labels = clustering.fit_predict(hash_array)
        
        # Create cluster mapping
        cluster_map = {}
        for img_path, label in zip(image_paths, labels):
            cluster_map[img_path] = int(label)
        
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        print(f"✅ Created {n_clusters} similarity clusters")
        
        return cluster_map


class DatasetSplitter:
    """Create stratified train/val/test/holdout splits"""
    
    def __init__(self, train_ratio: float = 0.7, val_ratio: float = 0.15, 
                 test_ratio: float = 0.15, holdout_ratio: float = 0.1):
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.holdout_ratio = holdout_ratio
    
    def create_splits(self, metadata_list: List[ImageMetadata], 
                     cluster_map: Dict[str, int]) -> Dict[str, List[ImageMetadata]]:
        """Create stratified splits with cluster awareness"""
        print("📊 Creating train/val/test/holdout splits...")
        
        # First, separate holdout set (10% from different datasets if possible)
        holdout_images, remaining_images = self._create_holdout_set(metadata_list)
        
        # Then split remaining into train/val/test
        train_images, val_images, test_images = self._split_remaining(
            remaining_images, cluster_map
        )
        
        splits = {
            'train': train_images,
            'val': val_images,
            'test': test_images,
            'holdout': holdout_images
        }
        
        print(f"✅ Train: {len(train_images)}, Val: {len(val_images)}, "
              f"Test: {len(test_images)}, Holdout: {len(holdout_images)}")
        
        return splits
    
    def _create_holdout_set(self, metadata_list: List[ImageMetadata]) -> Tuple[List, List]:
        """Create 10% holdout from different dataset sources"""
        # Group by dataset and class
        dataset_class_groups = defaultdict(list)
        for meta in metadata_list:
            key = f"{meta.dataset_source}::{meta.canonical_class}"
            dataset_class_groups[key].append(meta)
        
        # Try to get diverse holdout set
        holdout = []
        remaining = []
        target_holdout = int(len(metadata_list) * self.holdout_ratio)
        
        # Sort groups by size (smallest first) to ensure diversity
        sorted_groups = sorted(dataset_class_groups.items(), key=lambda x: len(x[1]))
        
        for key, images in sorted_groups:
            if len(holdout) < target_holdout:
                # Take some from this group for holdout
                n_holdout = max(1, int(len(images) * 0.1))
                holdout.extend(images[:n_holdout])
                remaining.extend(images[n_holdout:])
            else:
                remaining.extend(images)
        
        return holdout, remaining
    
    def _split_remaining(self, metadata_list: List[ImageMetadata], 
                        cluster_map: Dict[str, int]) -> Tuple[List, List, List]:
        """Split remaining data into train/val/test with cluster awareness"""
        # Adjust ratios (excluding holdout)
        total = self.train_ratio + self.val_ratio + self.test_ratio
        adj_train = self.train_ratio / total
        adj_val = self.val_ratio / total
        adj_test = self.test_ratio / total
        
        # Group by class
        class_groups = defaultdict(list)
        for meta in metadata_list:
            class_groups[meta.canonical_class].append(meta)
        
        train_images = []
        val_images = []
        test_images = []
        
        # Split each class separately (stratified)
        for class_name, images in class_groups.items():
            if len(images) < 3:
                # Too few samples - put all in train
                train_images.extend(images)
                continue
            
            # Group by cluster to keep similar images together
            cluster_groups = defaultdict(list)
            for img in images:
                cluster_id = cluster_map.get(img.image_path, -1)
                cluster_groups[cluster_id].append(img)
            
            # Split clusters across train/val/test
            clusters = list(cluster_groups.values())
            n_total = len(images)
            n_train = int(n_total * adj_train)
            n_val = int(n_total * adj_val)
            
            cluster_assignments = []
            for cluster in clusters:
                cluster_assignments.append(cluster)
            
            # Distribute clusters
            current_train = []
            current_val = []
            current_test = []
            
            for cluster in cluster_assignments:
                if len(current_train) < n_train:
                    current_train.extend(cluster)
                elif len(current_val) < n_val:
                    current_val.extend(cluster)
                else:
                    current_test.extend(cluster)
            
            train_images.extend(current_train)
            val_images.extend(current_val)
            test_images.extend(current_test)
        
        return train_images, val_images, test_images


class DatasetMerger:
    """Main orchestrator for dataset merging"""
    
    def __init__(self, datasets_root: str, output_root: str):
        self.datasets_root = Path(datasets_root)
        self.output_root = Path(output_root)
        self.merged_dataset_dir = self.output_root / "merged_dataset"
        self.reports_dir = self.output_root / "reports"
        
        # Create output directories
        self.merged_dataset_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.scanner = DatasetScanner(datasets_root)
        self.analyzer = ImageAnalyzer()
        self.deduplicator = DeduplicationEngine()
        self.clusterer = SimilarityClusterer()
        self.splitter = DatasetSplitter()
        
        self.all_metadata = []
    
    def merge_all_datasets(self):
        """Execute complete dataset merging pipeline"""
        print("="*60)
        print("🚀 Starting Dataset Merger Pipeline")
        print("="*60)
        
        # Step 1: Scan all datasets
        image_records = self.scanner.scan_all_datasets()
        
        # Step 2: Analyze images and collect metadata
        print("\n📊 Analyzing images...")
        for i, record in enumerate(image_records):
            if (i + 1) % 100 == 0:
                print(f"  Analyzed {i + 1}/{len(image_records)} images...")
            
            img_analysis = self.analyzer.analyze_image(record['image_path'])
            
            # Merge record and analysis
            metadata = ImageMetadata(
                image_path=record['image_path'],
                canonical_class=record['canonical_class'],
                dataset_source=record['dataset_source'],
                original_path=record['original_path'],
                original_filename=record['original_filename'],
                is_augmented=record['is_augmented'],
                **img_analysis
            )
            self.all_metadata.append(metadata)
        
        print(f"✅ Analyzed {len(self.all_metadata)} images")
        
        # Step 3: Deduplicate
        unique_metadata, provenance = self.deduplicator.find_duplicates(self.all_metadata)
        
        # Step 4: Cluster similar images
        cluster_map = self.clusterer.cluster_images(unique_metadata)
        
        # Step 5: Create splits
        splits = self.splitter.create_splits(unique_metadata, cluster_map)
        
        # Step 6: Organize files and create outputs
        print("\n📁 Organizing merged dataset...")
        self._organize_merged_dataset(splits)
        
        # Step 7: Generate reports
        print("\n📝 Generating reports...")
        self._generate_metadata_csv(unique_metadata)
        self._generate_provenance_csv(provenance)
        self._generate_duplicates_report(provenance)
        self._generate_clusters_csv(cluster_map, unique_metadata)
        self._generate_splits_csv(splits)
        self._generate_summary_report(unique_metadata, splits, provenance)
        
        print("\n" + "="*60)
        print("✅ Dataset Merging Complete!")
        print("="*60)
        print(f"📁 Output location: {self.output_root}")
        print(f"📊 Reports location: {self.reports_dir}")
    
    def _organize_merged_dataset(self, splits: Dict[str, List[ImageMetadata]]):
        """Organize images into structured directories"""
        for split_name, images in splits.items():
            split_dir = self.merged_dataset_dir / split_name
            split_dir.mkdir(exist_ok=True)
            
            for meta in images:
                # Create class/dataset directory structure
                class_dir = split_dir / meta.canonical_class / meta.dataset_source
                class_dir.mkdir(parents=True, exist_ok=True)
                
                # Copy image
                dest_path = class_dir / meta.original_filename
                
                # Handle name conflicts
                counter = 1
                while dest_path.exists():
                    stem = Path(meta.original_filename).stem
                    suffix = Path(meta.original_filename).suffix
                    dest_path = class_dir / f"{stem}_{counter}{suffix}"
                    counter += 1
                
                shutil.copy2(meta.image_path, dest_path)
    
    def _generate_metadata_csv(self, metadata_list: List[ImageMetadata]):
        """Generate unified metadata CSV"""
        csv_path = self.reports_dir / "merged_metadata.csv"
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            if metadata_list:
                fieldnames = list(asdict(metadata_list[0]).keys())
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for meta in metadata_list:
                    writer.writerow(asdict(meta))
        
        print(f"  ✅ Metadata CSV: {csv_path}")
    
    def _generate_provenance_csv(self, provenance: List[ProvenanceEntry]):
        """Generate provenance tracking CSV"""
        csv_path = self.reports_dir / "provenance_map.csv"
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            if provenance:
                fieldnames = list(asdict(provenance[0]).keys())
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for entry in provenance:
                    writer.writerow(asdict(entry))
        
        print(f"  ✅ Provenance CSV: {csv_path}")
    
    def _generate_duplicates_report(self, provenance: List[ProvenanceEntry]):
        """Generate duplicates report"""
        csv_path = self.reports_dir / "duplicates_report.csv"
        
        duplicates = [p for p in provenance if not p.kept]
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            if duplicates:
                fieldnames = list(asdict(duplicates[0]).keys())
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for dup in duplicates:
                    writer.writerow(asdict(dup))
        
        print(f"  ✅ Duplicates Report: {csv_path}")
    
    def _generate_clusters_csv(self, cluster_map: Dict[str, int], 
                               metadata_list: List[ImageMetadata]):
        """Generate similarity clusters CSV"""
        csv_path = self.reports_dir / "similarity_clusters.csv"
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['image_path', 'canonical_class', 'cluster_id'])
            
            for meta in metadata_list:
                cluster_id = cluster_map.get(meta.image_path, -1)
                writer.writerow([meta.image_path, meta.canonical_class, cluster_id])
        
        print(f"  ✅ Clusters CSV: {csv_path}")
    
    def _generate_splits_csv(self, splits: Dict[str, List[ImageMetadata]]):
        """Generate split assignments CSV"""
        csv_path = self.reports_dir / "split_files_list.csv"
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['image_path', 'canonical_class', 'dataset_source', 'split'])
            
            for split_name, images in splits.items():
                for meta in images:
                    writer.writerow([meta.image_path, meta.canonical_class, 
                                   meta.dataset_source, split_name])
        
        print(f"  ✅ Splits CSV: {csv_path}")
    
    def _generate_summary_report(self, metadata_list: List[ImageMetadata],
                                splits: Dict[str, List[ImageMetadata]],
                                provenance: List[ProvenanceEntry]):
        """Generate comprehensive summary report"""
        report_path = self.reports_dir / "MERGE_SUMMARY.md"
        
        # Calculate statistics
        total_images = len(metadata_list)
        duplicates_removed = len([p for p in provenance if not p.kept])
        datasets = set(m.dataset_source for m in metadata_list)
        classes = set(m.canonical_class for m in metadata_list)
        
        # Class distribution
        class_dist = defaultdict(int)
        for meta in metadata_list:
            class_dist[meta.canonical_class] += 1
        
        # Split distribution
        split_dist = {name: len(images) for name, images in splits.items()}
        
        # Generate report
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Dataset Merger Summary Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Overview\n\n")
            f.write(f"- **Total Unique Images:** {total_images:,}\n")
            f.write(f"- **Duplicates Removed:** {duplicates_removed:,}\n")
            f.write(f"- **Number of Datasets:** {len(datasets)}\n")
            f.write(f"- **Number of Classes:** {len(classes)}\n\n")
            
            f.write("## Datasets Included\n\n")
            for ds in sorted(datasets):
                count = len([m for m in metadata_list if m.dataset_source == ds])
                f.write(f"- **{ds}**: {count:,} images\n")
            
            f.write("\n## Class Distribution\n\n")
            f.write("| Class | Count |\n")
            f.write("|-------|-------|\n")
            for cls, count in sorted(class_dist.items(), key=lambda x: -x[1]):
                f.write(f"| {cls} | {count:,} |\n")
            
            f.write("\n## Split Distribution\n\n")
            f.write("| Split | Count | Percentage |\n")
            f.write("|-------|-------|------------|\n")
            for split_name in ['train', 'val', 'test', 'holdout']:
                count = split_dist.get(split_name, 0)
                pct = (count / total_images * 100) if total_images > 0 else 0
                f.write(f"| {split_name.capitalize()} | {count:,} | {pct:.1f}% |\n")
            
            f.write("\n## Quality Metrics\n\n")
            avg_quality = np.mean([m.quality_score for m in metadata_list])
            avg_resolution = np.mean([m.width * m.height for m in metadata_list])
            f.write(f"- **Average Quality Score:** {avg_quality:.2f}/100\n")
            f.write(f"- **Average Resolution:** {avg_resolution:,.0f} pixels\n")
            
            f.write("\n## Files Generated\n\n")
            f.write("- `merged_dataset/` - Organized image files\n")
            f.write("- `reports/merged_metadata.csv` - Complete metadata\n")
            f.write("- `reports/provenance_map.csv` - Provenance tracking\n")
            f.write("- `reports/duplicates_report.csv` - Removed duplicates\n")
            f.write("- `reports/similarity_clusters.csv` - Image clusters\n")
            f.write("- `reports/split_files_list.csv` - Split assignments\n")
            
            f.write("\n## Next Steps\n\n")
            f.write("1. Review the merged dataset structure\n")
            f.write("2. Validate class distributions\n")
            f.write("3. Check holdout set diversity\n")
            f.write("4. Begin model training on train/val sets\n")
            f.write("5. Keep holdout set untouched until final evaluation\n")
        
        print(f"  ✅ Summary Report: {report_path}")


def load_config(config_path: str = None) -> Dict:
    """Load configuration from JSON file"""
    if config_path is None:
        config_path = Path(__file__).parent / "merger_config.json"
    
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config['merger_config']
    except Exception as e:
        print(f"⚠️  Warning: Could not load config file: {e}")
        print("Using default configuration...")
        return None


def main(config_path: str = None):
    """Main entry point"""
    # Load configuration
    config = load_config(config_path)
    
    if config:
        print("✅ Loaded configuration from merger_config.json")
        DATASETS_ROOT = config['paths']['datasets_root']
        OUTPUT_ROOT = config['paths']['output_root']
    else:
        # Default configuration
        DATASETS_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\myDatasets"
        OUTPUT_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\merged_output"
    
    # Create merger
    merger = DatasetMerger(DATASETS_ROOT, OUTPUT_ROOT)
    
    # Execute merging
    merger.merge_all_datasets()


if __name__ == "__main__":
    import sys
    config_file = sys.argv[1] if len(sys.argv) > 1 else None
    main(config_file)
