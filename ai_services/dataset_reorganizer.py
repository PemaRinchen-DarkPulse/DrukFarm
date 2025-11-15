"""
Dataset Reorganizer - Apply Canonical Taxonomy
Reorganizes datasets using canonical labels from taxonomy designer
"""

import os
import shutil
from pathlib import Path
import pandas as pd
from collections import defaultdict
from tqdm import tqdm
import json


class DatasetReorganizer:
    """Reorganize datasets using canonical taxonomy"""
    
    def __init__(self, datasets_root, mapping_file, output_root, create_splits=True):
        self.datasets_root = Path(datasets_root)
        self.output_root = Path(output_root)
        self.mapping_file = Path(mapping_file)
        self.create_splits = create_splits
        
        # Load mapping
        self.load_mapping()
        
        print(f"[✓] Dataset Reorganizer initialized")
        print(f"[✓] Source datasets: {self.datasets_root}")
        print(f"[✓] Output directory: {self.output_root}")
        print(f"[✓] Mapping file: {self.mapping_file}")
    
    def load_mapping(self):
        """Load canonical label mapping"""
        print("\nLoading label mapping...")
        
        self.mapping_df = pd.read_csv(self.mapping_file)
        
        # Create lookup dictionaries
        self.raw_to_canonical = dict(
            zip(self.mapping_df['raw_label'], self.mapping_df['canonical_label'])
        )
        
        # Filter out Unknown and low-confidence if needed
        self.valid_mappings = self.mapping_df[
            (self.mapping_df['canonical_label'] != 'Unknown') &
            (self.mapping_df['confidence'].isin(['High', 'Medium']))
        ]
        
        print(f"[✓] Loaded {len(self.mapping_df)} label mappings")
        print(f"[✓] Valid mappings (excluding Unknown): {len(self.valid_mappings)}")
    
    def reorganize_datasets(self, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
        """Reorganize all datasets with canonical labels and train/val/test splits"""
        print("\n" + "="*70)
        print("REORGANIZING DATASETS WITH CANONICAL LABELS")
        print("="*70)
        
        # Create output structure
        if self.create_splits:
            for split in ['train', 'val', 'test']:
                (self.output_root / split).mkdir(parents=True, exist_ok=True)
        else:
            self.output_root.mkdir(parents=True, exist_ok=True)
        
        # Track statistics
        stats = defaultdict(lambda: {'train': 0, 'val': 0, 'test': 0, 'total': 0})
        skipped = []
        
        # Image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        
        # Process each dataset
        for dataset_folder in self.datasets_root.iterdir():
            if not dataset_folder.is_dir():
                continue
            
            print(f"\n📁 Processing: {dataset_folder.name}")
            
            # Find all images
            images = []
            for ext in image_extensions:
                images.extend(dataset_folder.rglob(f"*{ext}"))
            
            print(f"   Found {len(images)} images")
            
            # Process each image
            for img_path in tqdm(images, desc=f"   Reorganizing {dataset_folder.name}"):
                # Extract raw label
                raw_label = self._extract_label_from_path(img_path, dataset_folder)
                
                if not raw_label:
                    skipped.append({
                        'path': str(img_path),
                        'reason': 'Could not extract label'
                    })
                    continue
                
                # Map to canonical label
                canonical_label = self.raw_to_canonical.get(raw_label)
                
                if not canonical_label or canonical_label == 'Unknown':
                    skipped.append({
                        'path': str(img_path),
                        'raw_label': raw_label,
                        'reason': 'No canonical mapping or Unknown'
                    })
                    continue
                
                # Determine split
                if self.create_splits:
                    split = self._determine_split(
                        img_path, train_ratio, val_ratio, test_ratio
                    )
                    dest_dir = self.output_root / split / canonical_label
                else:
                    dest_dir = self.output_root / canonical_label
                    split = 'total'
                
                # Create destination directory
                dest_dir.mkdir(parents=True, exist_ok=True)
                
                # Copy image
                dest_path = dest_dir / img_path.name
                
                # Handle duplicate filenames
                if dest_path.exists():
                    base = dest_path.stem
                    ext = dest_path.suffix
                    counter = 1
                    while dest_path.exists():
                        dest_path = dest_dir / f"{base}_{counter}{ext}"
                        counter += 1
                
                shutil.copy2(img_path, dest_path)
                
                # Update statistics
                stats[canonical_label][split] += 1
                stats[canonical_label]['total'] += 1
        
        # Save statistics
        self._save_reorganization_stats(stats, skipped)
        
        print(f"\n[✓] Reorganization complete!")
        print(f"[✓] Total classes: {len(stats)}")
        print(f"[✓] Images copied: {sum(s['total'] for s in stats.values())}")
        print(f"[✓] Images skipped: {len(skipped)}")
    
    def _extract_label_from_path(self, img_path, dataset_root):
        """Extract label from image path"""
        relative_path = img_path.relative_to(dataset_root)
        parts = relative_path.parts
        
        # Skip common folder names
        skip_names = {'train', 'test', 'val', 'validation', 'images', 
                     'data', 'dataset', 'samples'}
        
        # Check parent folder
        if len(parts) >= 2:
            potential_label = parts[-2]
            if potential_label.lower() not in skip_names:
                return potential_label
        
        # Check grandparent folder
        if len(parts) >= 3:
            potential_label = parts[-3]
            if potential_label.lower() not in skip_names:
                return potential_label
        
        return None
    
    def _determine_split(self, img_path, train_ratio, val_ratio, test_ratio):
        """Determine which split an image belongs to"""
        # Use hash of filename for consistent splitting
        hash_val = hash(str(img_path)) % 100
        
        train_threshold = int(train_ratio * 100)
        val_threshold = int((train_ratio + val_ratio) * 100)
        
        if hash_val < train_threshold:
            return 'train'
        elif hash_val < val_threshold:
            return 'val'
        else:
            return 'test'
    
    def _save_reorganization_stats(self, stats, skipped):
        """Save reorganization statistics"""
        # Convert to DataFrame
        stats_records = []
        for canonical_label, counts in sorted(stats.items()):
            record = {
                'Canonical Label': canonical_label,
                'Total': counts['total']
            }
            if self.create_splits:
                record.update({
                    'Train': counts['train'],
                    'Val': counts['val'],
                    'Test': counts['test']
                })
            stats_records.append(record)
        
        stats_df = pd.DataFrame(stats_records)
        stats_df = stats_df.sort_values('Total', ascending=False)
        
        # Save statistics
        stats_path = self.output_root / "reorganization_statistics.csv"
        stats_df.to_csv(stats_path, index=False)
        print(f"\n[✓] Saved statistics: {stats_path}")
        
        # Save skipped images
        if skipped:
            skipped_df = pd.DataFrame(skipped)
            skipped_path = self.output_root / "skipped_images.csv"
            skipped_df.to_csv(skipped_path, index=False)
            print(f"[✓] Saved skipped images: {skipped_path}")
        
        # Print summary
        print("\n" + "="*70)
        print("REORGANIZATION SUMMARY")
        print("="*70)
        print(f"\nTop 10 Classes by Count:")
        for _, row in stats_df.head(10).iterrows():
            print(f"  {row['Canonical Label']:40s} - {row['Total']:6d} images")
    
    def create_dataset_metadata(self):
        """Create metadata file for the reorganized dataset"""
        metadata = {
            'name': 'DrukFarm Plant Disease Dataset - Canonical',
            'version': '1.0',
            'created': pd.Timestamp.now().isoformat(),
            'source_datasets': [d.name for d in self.datasets_root.iterdir() if d.is_dir()],
            'mapping_file': str(self.mapping_file),
            'num_classes': len(set(self.raw_to_canonical.values())) - (1 if 'Unknown' in self.raw_to_canonical.values() else 0),
            'splits': ['train', 'val', 'test'] if self.create_splits else ['all'],
            'image_formats': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp']
        }
        
        metadata_path = self.output_root / "dataset_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"[✓] Saved metadata: {metadata_path}")


def main():
    """Main execution"""
    # Configuration
    DATASETS_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\myDatasets"
    MAPPING_FILE = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\taxonomy_output\raw_to_canonical_mapping.csv"
    OUTPUT_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\canonical_dataset"
    
    # Train/Val/Test split ratios
    TRAIN_RATIO = 0.7
    VAL_RATIO = 0.15
    TEST_RATIO = 0.15
    
    print("="*70)
    print("DATASET REORGANIZER")
    print("="*70)
    print(f"\nThis will reorganize datasets using canonical labels")
    print(f"Source: {DATASETS_ROOT}")
    print(f"Output: {OUTPUT_ROOT}")
    print(f"Splits: Train {TRAIN_RATIO*100}%, Val {VAL_RATIO*100}%, Test {TEST_RATIO*100}%")
    
    response = input("\nProceed with reorganization? (y/n): ")
    
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Create reorganizer
    reorganizer = DatasetReorganizer(
        DATASETS_ROOT,
        MAPPING_FILE,
        OUTPUT_ROOT,
        create_splits=True
    )
    
    # Reorganize datasets
    reorganizer.reorganize_datasets(
        train_ratio=TRAIN_RATIO,
        val_ratio=VAL_RATIO,
        test_ratio=TEST_RATIO
    )
    
    # Create metadata
    reorganizer.create_dataset_metadata()
    
    print("\n✅ Dataset reorganization complete!")
    print(f"📁 Check output folder: {OUTPUT_ROOT}")
    print(f"\n📋 Next steps:")
    print("   1. Review reorganization_statistics.csv")
    print("   2. Check skipped_images.csv (if any)")
    print("   3. Verify dataset structure")
    print("   4. Begin model training with canonical labels")


if __name__ == "__main__":
    main()
