"""
Dataset Merger Validation Script
Tests the merger on a small subset before processing the full dataset.
"""

import os
import sys
from pathlib import Path
import shutil
import tempfile

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dataset_merger import (
    DatasetScanner, 
    ImageAnalyzer, 
    DeduplicationEngine,
    SimilarityClusterer,
    DatasetSplitter,
    ImageMetadata
)


def create_test_dataset(temp_dir: Path, num_images: int = 50):
    """Create a small test dataset"""
    print("📁 Creating test dataset...")
    
    # Get some images from actual datasets
    datasets_root = Path(r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\myDatasets")
    test_root = temp_dir / "test_datasets"
    test_root.mkdir(exist_ok=True)
    
    # Copy a few images from each dataset
    copied = 0
    for dataset in datasets_root.iterdir():
        if dataset.is_dir() and not dataset.name.startswith('.'):
            # Find some images
            for img_path in dataset.rglob('*'):
                if img_path.is_file() and img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    # Create test structure
                    rel_path = img_path.relative_to(datasets_root)
                    dest = test_root / rel_path
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Copy image
                    shutil.copy2(img_path, dest)
                    copied += 1
                    
                    if copied >= num_images:
                        break
            if copied >= num_images:
                break
    
    print(f"✅ Created test dataset with {copied} images")
    return test_root


def validate_scanner(test_root: Path):
    """Test DatasetScanner"""
    print("\n🔍 Testing DatasetScanner...")
    
    scanner = DatasetScanner(test_root)
    records = scanner.scan_all_datasets()
    
    assert len(records) > 0, "Scanner found no images"
    assert all('image_path' in r for r in records), "Missing image_path in records"
    assert all('canonical_class' in r for r in records), "Missing canonical_class in records"
    
    print(f"✅ Scanner test passed - found {len(records)} images")
    return records


def validate_analyzer(records: list):
    """Test ImageAnalyzer"""
    print("\n🔍 Testing ImageAnalyzer...")
    
    analyzer = ImageAnalyzer()
    
    # Test first few images
    for i, record in enumerate(records[:5]):
        metadata = analyzer.analyze_image(record['image_path'])
        
        assert 'md5_hash' in metadata, f"Missing md5_hash for image {i}"
        assert 'perceptual_hash' in metadata, f"Missing perceptual_hash for image {i}"
        assert 'quality_score' in metadata, f"Missing quality_score for image {i}"
        assert metadata['quality_score'] >= 0, f"Invalid quality score for image {i}"
    
    print(f"✅ Analyzer test passed - analyzed {min(5, len(records))} images")


def validate_deduplicator(metadata_list: list):
    """Test DeduplicationEngine"""
    print("\n🔍 Testing DeduplicationEngine...")
    
    deduplicator = DeduplicationEngine()
    unique, provenance = deduplicator.find_duplicates(metadata_list)
    
    assert len(unique) <= len(metadata_list), "More unique than input!"
    assert len(provenance) == len(metadata_list), "Provenance count mismatch"
    
    # Check provenance
    kept_count = sum(1 for p in provenance if p.kept)
    assert kept_count == len(unique), "Provenance kept count mismatch"
    
    print(f"✅ Deduplicator test passed - {len(metadata_list)} → {len(unique)} unique")
    print(f"   Removed {len(metadata_list) - len(unique)} duplicates")
    return unique, provenance


def validate_clusterer(metadata_list: list):
    """Test SimilarityClusterer"""
    print("\n🔍 Testing SimilarityClusterer...")
    
    clusterer = SimilarityClusterer()
    cluster_map = clusterer.cluster_images(metadata_list)
    
    assert isinstance(cluster_map, dict), "Cluster map should be dict"
    
    # Check cluster IDs are integers
    for img_path, cluster_id in cluster_map.items():
        assert isinstance(cluster_id, int), f"Cluster ID not int for {img_path}"
    
    n_clusters = len(set(cluster_map.values())) - (1 if -1 in cluster_map.values() else 0)
    print(f"✅ Clusterer test passed - created {n_clusters} clusters")
    return cluster_map


def validate_splitter(metadata_list: list, cluster_map: dict):
    """Test DatasetSplitter"""
    print("\n🔍 Testing DatasetSplitter...")
    
    splitter = DatasetSplitter()
    splits = splitter.create_splits(metadata_list, cluster_map)
    
    assert 'train' in splits, "Missing train split"
    assert 'val' in splits, "Missing val split"
    assert 'test' in splits, "Missing test split"
    assert 'holdout' in splits, "Missing holdout split"
    
    total = sum(len(images) for images in splits.values())
    assert total == len(metadata_list), f"Split total mismatch: {total} != {len(metadata_list)}"
    
    # Check no overlap
    all_paths = set()
    for split_name, images in splits.items():
        paths = set(img.image_path for img in images)
        overlap = all_paths & paths
        assert len(overlap) == 0, f"Overlap found in {split_name}"
        all_paths.update(paths)
    
    print(f"✅ Splitter test passed")
    for name, images in splits.items():
        pct = len(images) / len(metadata_list) * 100
        print(f"   {name}: {len(images)} ({pct:.1f}%)")
    
    return splits


def run_validation():
    """Run all validation tests"""
    print("="*60)
    print("🧪 Dataset Merger Validation Suite")
    print("="*60)
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        try:
            # Step 1: Create test dataset
            test_root = create_test_dataset(temp_path, num_images=50)
            
            # Step 2: Test scanner
            records = validate_scanner(test_root)
            
            # Step 3: Test analyzer
            validate_analyzer(records)
            
            # Step 4: Create metadata objects
            print("\n📊 Creating metadata objects...")
            analyzer = ImageAnalyzer()
            metadata_list = []
            
            for record in records:
                img_analysis = analyzer.analyze_image(record['image_path'])
                metadata = ImageMetadata(
                    image_path=record['image_path'],
                    canonical_class=record['canonical_class'],
                    dataset_source=record['dataset_source'],
                    original_path=record['original_path'],
                    original_filename=record['original_filename'],
                    is_augmented=record.get('is_augmented', False),
                    **img_analysis
                )
                metadata_list.append(metadata)
            
            print(f"✅ Created {len(metadata_list)} metadata objects")
            
            # Step 5: Test deduplicator
            unique_metadata, provenance = validate_deduplicator(metadata_list)
            
            # Step 6: Test clusterer
            cluster_map = validate_clusterer(unique_metadata)
            
            # Step 7: Test splitter
            splits = validate_splitter(unique_metadata, cluster_map)
            
            print("\n" + "="*60)
            print("✅ All validation tests passed!")
            print("="*60)
            print("\n🎯 Next Steps:")
            print("1. Review the test results above")
            print("2. Adjust configuration if needed (merger_config.json)")
            print("3. Run the full merger: python dataset_merger.py")
            print("4. Monitor the process and check reports")
            
            return True
            
        except AssertionError as e:
            print(f"\n❌ Validation failed: {e}")
            return False
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            return False


def check_dependencies():
    """Check if all required packages are installed"""
    print("🔍 Checking dependencies...")
    
    required = {
        'numpy': 'numpy',
        'pandas': 'pandas',
        'PIL': 'pillow',
        'cv2': 'opencv-python',
        'sklearn': 'scikit-learn',
        'imagehash': 'imagehash'
    }
    
    missing = []
    for module, package in required.items():
        try:
            __import__(module)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ✗ {package} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n❌ Missing dependencies: {', '.join(missing)}")
        print("Install with: pip install -r requirements_merger.txt")
        return False
    
    print("✅ All dependencies installed\n")
    return True


if __name__ == "__main__":
    print("Dataset Merger Validation Script\n")
    
    # Check dependencies first
    if not check_dependencies():
        sys.exit(1)
    
    # Run validation
    success = run_validation()
    
    sys.exit(0 if success else 1)
