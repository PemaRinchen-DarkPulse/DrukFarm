"""
Quick Start Script for Dataset Merger
=====================================

This script provides an interactive interface to run the dataset merger
with sensible defaults and guided prompts.

Usage:
    python run_merger.py
"""

import os
import sys
from pathlib import Path

def print_header():
    """Print welcome header."""
    print("\n" + "=" * 80)
    print("🌾 PLANT DISEASE DATASET MERGER - Quick Start")
    print("=" * 80)
    print("\nThis tool will merge all your plant disease datasets into a unified,")
    print("high-quality dataset with proper structure and metadata.\n")

def check_dependencies():
    """Check if required packages are installed."""
    print("📦 Checking dependencies...")
    
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
            print(f"  ✗ {package} (missing)")
            missing.append(package)
    
    if missing:
        print("\n⚠ Missing dependencies detected!")
        print(f"\nPlease install: pip install {' '.join(missing)}")
        return False
    
    print("\n✓ All dependencies are installed!\n")
    return True

def get_user_input():
    """Get configuration from user."""
    print("⚙️  Configuration")
    print("-" * 80)
    
    # Get datasets root
    default_root = "myDatasets"
    datasets_root = input(f"\nDatasets folder [{default_root}]: ").strip()
    if not datasets_root:
        datasets_root = default_root
    
    # Check if exists
    if not os.path.exists(datasets_root):
        print(f"\n⚠ Warning: Folder '{datasets_root}' not found!")
        create = input("Would you like to use it anyway? (y/n): ").lower()
        if create != 'y':
            return None
    
    # Get output root
    default_output = str(Path(datasets_root) / "merged_dataset")
    output_root = input(f"Output folder [{default_output}]: ").strip()
    if not output_root:
        output_root = default_output
    
    # Ask about split ratios
    print("\n📊 Dataset Split Configuration")
    print("-" * 80)
    print("Default splits: Train=70%, Val=15%, Test=15%, Hold-out=10%")
    use_defaults = input("Use default splits? (Y/n): ").strip().lower()
    
    if use_defaults == 'n':
        try:
            train_ratio = float(input("Train ratio (0.0-1.0) [0.7]: ") or 0.7)
            val_ratio = float(input("Validation ratio (0.0-1.0) [0.15]: ") or 0.15)
            test_ratio = float(input("Test ratio (0.0-1.0) [0.15]: ") or 0.15)
            holdout_ratio = float(input("Hold-out ratio (0.0-1.0) [0.10]: ") or 0.10)
        except ValueError:
            print("Invalid input. Using defaults.")
            train_ratio, val_ratio, test_ratio, holdout_ratio = 0.7, 0.15, 0.15, 0.10
    else:
        train_ratio, val_ratio, test_ratio, holdout_ratio = 0.7, 0.15, 0.15, 0.10
    
    # Random seed
    random_seed = input("\nRandom seed for reproducibility [42]: ").strip()
    random_seed = int(random_seed) if random_seed else 42
    
    config = {
        'datasets_root': datasets_root,
        'output_root': output_root,
        'train_ratio': train_ratio,
        'val_ratio': val_ratio,
        'test_ratio': test_ratio,
        'holdout_ratio': holdout_ratio,
        'random_seed': random_seed
    }
    
    # Confirm
    print("\n" + "=" * 80)
    print("📋 Configuration Summary")
    print("=" * 80)
    print(f"Source folder: {config['datasets_root']}")
    print(f"Output folder: {config['output_root']}")
    print(f"Train split: {config['train_ratio']*100:.1f}%")
    print(f"Validation split: {config['val_ratio']*100:.1f}%")
    print(f"Test split: {config['test_ratio']*100:.1f}%")
    print(f"Hold-out split: {config['holdout_ratio']*100:.1f}%")
    print(f"Random seed: {config['random_seed']}")
    print("=" * 80)
    
    confirm = input("\nProceed with merge? (Y/n): ").strip().lower()
    if confirm == 'n':
        return None
    
    return config

def run_merger(config):
    """Run the dataset merger with given configuration."""
    try:
        from dataset_merger import DatasetMerger
        
        print("\n🚀 Starting dataset merger...")
        print("=" * 80 + "\n")
        
        merger = DatasetMerger(
            datasets_root=config['datasets_root'],
            output_root=config['output_root']
        )
        
        # Run the complete pipeline
        merger.scan_datasets()
        merger.deduplicate_images()
        merger.cluster_similar_images()
        merger.create_stratified_splits(
            train_ratio=config['train_ratio'],
            val_ratio=config['val_ratio'],
            test_ratio=config['test_ratio'],
            holdout_ratio=config['holdout_ratio'],
            random_seed=config['random_seed']
        )
        merger.create_output_structure()
        merger.generate_metadata_files()
        merger.generate_summary_report()
        
        print("\n" + "=" * 80)
        print("✅ MERGE COMPLETE!")
        print("=" * 80)
        print(f"\n📁 Your merged dataset is ready at: {config['output_root']}")
        print("\n📄 Check the following files:")
        print(f"   - Summary: {config['output_root']}/reports/merge_summary_report.txt")
        print(f"   - Metadata: {config['output_root']}/metadata/merged_metadata.csv")
        print(f"   - Splits: {config['output_root']}/metadata/split_files_list.csv")
        print("\n💡 Next steps:")
        print("   1. Review the summary report")
        print("   2. Check class distributions")
        print("   3. Validate sample images")
        print("   4. Proceed with training!")
        print("\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during merge: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main entry point."""
    print_header()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Get configuration
    config = get_user_input()
    if config is None:
        print("\n❌ Merge cancelled by user.")
        sys.exit(0)
    
    # Run merger
    success = run_merger(config)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
