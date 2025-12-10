"""
Preprocessing Pipeline - Usage Examples
=======================================

Demonstrates various use cases for the preprocessing pipeline.

Author: Preprocessing Pipeline Architect
Date: December 10, 2025
"""

import os
from pathlib import Path
import pandas as pd
import numpy as np
from preprocessing_pipeline import (
    PreprocessingConfig, 
    PreprocessingPipeline,
    DatasetPreprocessor
)


def example_1_basic_preprocessing():
    """Example 1: Basic preprocessing with default settings."""
    print("\n" + "=" * 80)
    print("EXAMPLE 1: Basic Preprocessing")
    print("=" * 80)
    
    config = PreprocessingConfig()
    
    preprocessor = DatasetPreprocessor(
        dataset_path='merged_dataset/images/train',
        output_path='preprocessed/train',
        config=config
    )
    
    metadata_df = preprocessor.run()
    
    print(f"\n✓ Processed {len(metadata_df)} images")
    print(f"✓ Output: {preprocessor.output_path}")


def example_2_custom_quality_thresholds():
    """Example 2: Custom quality filtering thresholds."""
    print("\n" + "=" * 80)
    print("EXAMPLE 2: Custom Quality Thresholds")
    print("=" * 80)
    
    config = PreprocessingConfig(
        blur_threshold=150.0,  # Stricter (higher threshold)
        brightness_min=20.0,    # Darker images allowed
        brightness_max=235.0,   # Brighter images allowed
        remove_low_quality=False  # Flag only
    )
    
    preprocessor = DatasetPreprocessor(
        dataset_path='dataset',
        output_path='preprocessed_custom',
        config=config
    )
    
    metadata_df = preprocessor.run()
    
    # Analyze quality
    low_quality_count = metadata_df['is_low_quality'].sum()
    print(f"\n✓ Flagged {low_quality_count} low-quality images")
    print(f"✓ Kept all images (flag only mode)")


def example_3_compute_normalization_only():
    """Example 3: Compute normalization statistics without full preprocessing."""
    print("\n" + "=" * 80)
    print("EXAMPLE 3: Compute Normalization Statistics")
    print("=" * 80)
    
    # Get image paths
    dataset_path = Path('merged_dataset/images/train')
    image_paths = list(dataset_path.rglob("*.jpg"))
    
    # Initialize pipeline
    config = PreprocessingConfig()
    pipeline = PreprocessingPipeline(config)
    
    # Compute stats
    mean, std = pipeline.compute_normalization_stats(
        image_paths,
        sample_size=1000  # Use sample for speed
    )
    
    print(f"\n✓ Mean: {mean}")
    print(f"✓ Std: {std}")
    
    # Save
    stats_df = pd.DataFrame({
        'channel': ['R', 'G', 'B'],
        'mean': mean,
        'std': std
    })
    stats_df.to_csv('custom_normalization_stats.csv', index=False)
    print(f"✓ Saved to custom_normalization_stats.csv")


def example_4_with_optional_enhancements():
    """Example 4: Enable optional preprocessing enhancements."""
    print("\n" + "=" * 80)
    print("EXAMPLE 4: Optional Enhancements")
    print("=" * 80)
    
    config = PreprocessingConfig(
        enable_contrast_normalization=True,  # CLAHE
        enable_denoising=True,               # Noise reduction
        remove_low_quality=True              # Remove bad images
    )
    
    preprocessor = DatasetPreprocessor(
        dataset_path='dataset',
        output_path='preprocessed_enhanced',
        config=config
    )
    
    metadata_df = preprocessor.run(save_images=True)
    
    print(f"\n✓ Enhanced and saved {len(metadata_df)} images")


def example_5_process_multiple_splits():
    """Example 5: Process train, val, test with same configuration."""
    print("\n" + "=" * 80)
    print("EXAMPLE 5: Process Multiple Splits")
    print("=" * 80)
    
    config = PreprocessingConfig()
    
    splits = ['train', 'val', 'test']
    
    # First, compute normalization from training set
    print("\nStep 1: Compute normalization from training set")
    train_preprocessor = DatasetPreprocessor(
        dataset_path='merged_dataset/images/train',
        output_path='preprocessed/train',
        config=config
    )
    train_metadata = train_preprocessor.run()
    
    # Get normalization stats
    mean = train_preprocessor.pipeline.mean
    std = train_preprocessor.pipeline.std
    class_to_id = train_preprocessor.pipeline.class_to_id
    
    print(f"✓ Normalization stats computed")
    print(f"✓ Mean: {mean}")
    print(f"✓ Std: {std}")
    
    # Process validation and test with same stats
    for split in ['val', 'test']:
        print(f"\nStep 2.{splits.index(split)}: Process {split} set")
        
        preprocessor = DatasetPreprocessor(
            dataset_path=f'merged_dataset/images/{split}',
            output_path=f'preprocessed/{split}',
            config=config
        )
        
        # Set pre-computed stats
        preprocessor.pipeline.mean = mean
        preprocessor.pipeline.std = std
        preprocessor.pipeline.class_to_id = class_to_id
        
        metadata_df = preprocessor.scan_dataset()
        processed_df = preprocessor.process_dataset(
            metadata_df,
            compute_normalization=False  # Skip re-computation
        )
        preprocessor.save_outputs(processed_df)
        
        print(f"✓ {split} set processed with same normalization")


def example_6_analyze_quality_metrics():
    """Example 6: Analyze quality metrics from preprocessing."""
    print("\n" + "=" * 80)
    print("EXAMPLE 6: Analyze Quality Metrics")
    print("=" * 80)
    
    # Load preprocessing metadata
    metadata_path = 'preprocessed/train/metadata/preprocessing_metadata.csv'
    
    if not Path(metadata_path).exists():
        print(f"❌ Metadata not found: {metadata_path}")
        print("   Run preprocessing first!")
        return
    
    df = pd.read_csv(metadata_path)
    
    print(f"\n📊 Quality Analysis:")
    print(f"   Total images: {len(df)}")
    print(f"   Low quality: {df['is_low_quality'].sum()}")
    print(f"   Blurry: {df['is_blurry'].sum()}")
    print(f"   Too dark: {df['is_too_dark'].sum()}")
    print(f"   Too bright: {df['is_too_bright'].sum()}")
    print(f"   Low contrast: {df['is_low_contrast'].sum()}")
    
    print(f"\n📈 Quality Score Statistics:")
    print(f"   Mean blur score: {df['blur_score'].mean():.2f}")
    print(f"   Min blur score: {df['blur_score'].min():.2f}")
    print(f"   Max blur score: {df['blur_score'].max():.2f}")
    
    print(f"\n💡 Brightness Statistics:")
    print(f"   Mean: {df['brightness'].mean():.2f}")
    print(f"   Min: {df['brightness'].min():.2f}")
    print(f"   Max: {df['brightness'].max():.2f}")
    
    # Find worst quality images
    worst_quality = df[df['is_low_quality']].nsmallest(10, 'blur_score')
    print(f"\n⚠️  10 Lowest Quality Images:")
    for idx, row in worst_quality.iterrows():
        print(f"   {row['filename']}: blur={row['blur_score']:.2f}")


def example_7_single_image_preprocessing():
    """Example 7: Preprocess single image for testing."""
    print("\n" + "=" * 80)
    print("EXAMPLE 7: Single Image Preprocessing")
    print("=" * 80)
    
    # Load normalization stats
    stats_path = 'preprocessed/train/metadata/dataset_mean_std.csv'
    
    if not Path(stats_path).exists():
        print(f"❌ Stats not found: {stats_path}")
        print("   Run preprocessing first!")
        return
    
    stats_df = pd.read_csv(stats_path)
    mean = stats_df['mean'].values
    std = stats_df['std'].values
    
    # Initialize pipeline
    config = PreprocessingConfig()
    pipeline = PreprocessingPipeline(config)
    pipeline.mean = mean
    pipeline.std = std
    
    # Preprocess single image
    image_path = 'path/to/test_image.jpg'
    
    if not Path(image_path).exists():
        print(f"❌ Image not found: {image_path}")
        return
    
    image, metadata = pipeline.preprocess_image(image_path)
    
    print(f"\n✓ Preprocessed image:")
    print(f"   Shape: {image.shape}")
    print(f"   Data type: {image.dtype}")
    print(f"   Value range: [{image.min():.3f}, {image.max():.3f}]")
    print(f"\n📊 Metadata:")
    for key, value in metadata.items():
        print(f"   {key}: {value}")


def example_8_export_label_statistics():
    """Example 8: Export label distribution statistics."""
    print("\n" + "=" * 80)
    print("EXAMPLE 8: Label Distribution")
    print("=" * 80)
    
    metadata_path = 'preprocessed/train/metadata/preprocessing_metadata.csv'
    label_map_path = 'preprocessed/train/metadata/label_map.csv'
    
    if not Path(metadata_path).exists():
        print(f"❌ Metadata not found: {metadata_path}")
        return
    
    df = pd.read_csv(metadata_path)
    label_map = pd.read_csv(label_map_path)
    
    # Count by class
    class_counts = df['canonical_class'].value_counts()
    
    print(f"\n📊 Label Distribution:")
    print(f"   Total classes: {len(class_counts)}")
    print(f"   Total images: {len(df)}")
    print(f"\n   Per-class counts:")
    
    for cls in sorted(class_counts.index):
        count = class_counts[cls]
        percentage = (count / len(df)) * 100
        label_id = label_map[label_map['class_name'] == cls]['class_id'].values[0]
        print(f"   [{label_id}] {cls}: {count} ({percentage:.1f}%)")
    
    # Check balance
    max_count = class_counts.max()
    min_count = class_counts.min()
    imbalance_ratio = max_count / min_count
    
    print(f"\n⚖️  Balance Analysis:")
    print(f"   Largest class: {max_count} images")
    print(f"   Smallest class: {min_count} images")
    print(f"   Imbalance ratio: {imbalance_ratio:.2f}:1")
    
    if imbalance_ratio > 3:
        print(f"   ⚠️  Dataset is imbalanced! Consider class weighting.")


def main():
    """Run examples menu."""
    print("\n" + "=" * 80)
    print("PREPROCESSING PIPELINE - EXAMPLES")
    print("=" * 80)
    
    examples = {
        '1': ('Basic preprocessing', example_1_basic_preprocessing),
        '2': ('Custom quality thresholds', example_2_custom_quality_thresholds),
        '3': ('Compute normalization only', example_3_compute_normalization_only),
        '4': ('With optional enhancements', example_4_with_optional_enhancements),
        '5': ('Process multiple splits', example_5_process_multiple_splits),
        '6': ('Analyze quality metrics', example_6_analyze_quality_metrics),
        '7': ('Single image preprocessing', example_7_single_image_preprocessing),
        '8': ('Label distribution statistics', example_8_export_label_statistics),
    }
    
    print("\nAvailable examples:")
    for key, (desc, _) in examples.items():
        print(f"  {key}. {desc}")
    print("  0. Exit")
    
    choice = input("\nEnter choice (0-8): ").strip()
    
    if choice == '0':
        print("\nExiting.\n")
        return
    
    if choice in examples:
        desc, func = examples[choice]
        print(f"\n▶ Running: {desc}")
        try:
            func()
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("\n❌ Invalid choice!")


if __name__ == "__main__":
    main()
