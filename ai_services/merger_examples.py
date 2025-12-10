"""
Example: Using Dataset Merger Programmatically
==============================================

This script demonstrates how to use the DatasetMerger class
programmatically with custom configurations and workflows.

Author: Dataset Integration Engineer
Date: December 10, 2025
"""

from pathlib import Path
from dataset_merger import DatasetMerger
import pandas as pd


def example_basic_merge():
    """
    Example 1: Basic merge with default settings
    """
    print("EXAMPLE 1: Basic Merge")
    print("=" * 80)
    
    merger = DatasetMerger(
        datasets_root='myDatasets',
        output_root='myDatasets/merged_basic'
    )
    
    merger.run()
    print("\n✓ Basic merge complete!\n")


def example_custom_splits():
    """
    Example 2: Custom split ratios
    """
    print("EXAMPLE 2: Custom Split Ratios")
    print("=" * 80)
    
    merger = DatasetMerger(
        datasets_root='myDatasets',
        output_root='myDatasets/merged_custom_splits'
    )
    
    # Scan and deduplicate
    merger.scan_datasets()
    merger.deduplicate_images()
    merger.cluster_similar_images()
    
    # Custom splits: 80% train, 10% val, 10% test, 5% holdout
    merger.create_stratified_splits(
        train_ratio=0.80,
        val_ratio=0.10,
        test_ratio=0.10,
        holdout_ratio=0.05,
        random_seed=42
    )
    
    merger.create_output_structure()
    merger.generate_metadata_files()
    merger.generate_summary_report()
    
    print("\n✓ Custom splits merge complete!\n")


def example_strict_deduplication():
    """
    Example 3: Stricter similarity threshold for clustering
    """
    print("EXAMPLE 3: Strict Deduplication")
    print("=" * 80)
    
    merger = DatasetMerger(
        datasets_root='myDatasets',
        output_root='myDatasets/merged_strict'
    )
    
    merger.scan_datasets()
    merger.deduplicate_images()
    
    # Stricter similarity threshold (lower = more strict)
    merger.cluster_similar_images(similarity_threshold=3.0)
    
    merger.create_stratified_splits()
    merger.create_output_structure()
    merger.generate_metadata_files()
    merger.generate_summary_report()
    
    print("\n✓ Strict deduplication complete!\n")


def example_analysis_only():
    """
    Example 4: Analysis only (no file copying)
    """
    print("EXAMPLE 4: Analysis Only")
    print("=" * 80)
    
    merger = DatasetMerger(
        datasets_root='myDatasets',
        output_root='myDatasets/merged_analysis_only'
    )
    
    # Only scan and analyze, don't copy files
    merger.scan_datasets()
    merger.deduplicate_images()
    merger.cluster_similar_images()
    merger.create_stratified_splits()
    
    # Skip file copying
    # merger.create_output_structure()  # Commented out
    
    # Generate metadata and reports only
    merger.generate_metadata_files()
    merger.generate_summary_report()
    
    print("\n✓ Analysis complete (no files copied)!\n")


def example_post_merge_analysis():
    """
    Example 5: Analyze merged dataset statistics
    """
    print("EXAMPLE 5: Post-Merge Analysis")
    print("=" * 80)
    
    # Load metadata
    metadata_path = Path('myDatasets/merged_dataset/metadata/merged_metadata.csv')
    
    if not metadata_path.exists():
        print("❌ Merged dataset not found. Run a merge first!")
        return
    
    df = pd.read_csv(metadata_path)
    
    # Get unique images only
    unique_df = df[df['is_duplicate'] == False]
    
    print("\n📊 Dataset Statistics:")
    print(f"Total images scanned: {len(df)}")
    print(f"Unique images: {len(unique_df)}")
    print(f"Duplicates removed: {len(df) - len(unique_df)}")
    
    print("\n📈 Split Distribution:")
    split_counts = unique_df['split'].value_counts()
    for split, count in split_counts.items():
        percentage = (count / len(unique_df)) * 100
        print(f"  {split}: {count} ({percentage:.1f}%)")
    
    print("\n🏷️  Class Distribution:")
    class_counts = unique_df['canonical_class'].value_counts()
    print(f"Total classes: {len(class_counts)}")
    print(f"\nTop 10 classes:")
    for cls, count in class_counts.head(10).items():
        print(f"  {cls}: {count} images")
    
    print("\n📏 Image Resolution Statistics:")
    print(f"  Mean resolution: {unique_df['resolution'].mean():.0f} pixels")
    print(f"  Min resolution: {unique_df['resolution'].min():.0f} pixels")
    print(f"  Max resolution: {unique_df['resolution'].max():.0f} pixels")
    
    print("\n⭐ Quality Score Statistics:")
    print(f"  Mean quality: {unique_df['quality_score'].mean():.2f}")
    print(f"  Min quality: {unique_df['quality_score'].min():.2f}")
    print(f"  Max quality: {unique_df['quality_score'].max():.2f}")
    
    # Find low quality images
    low_quality = unique_df[unique_df['quality_score'] < 30]
    print(f"\n⚠️  Low quality images (score < 30): {len(low_quality)}")
    
    print("\n✓ Analysis complete!\n")


def example_filter_by_quality():
    """
    Example 6: Filter merged dataset by quality threshold
    """
    print("EXAMPLE 6: Filter by Quality")
    print("=" * 80)
    
    metadata_path = Path('myDatasets/merged_dataset/metadata/split_files_list.csv')
    
    if not metadata_path.exists():
        print("❌ Merged dataset not found. Run a merge first!")
        return
    
    df = pd.read_csv(metadata_path)
    
    # Load full metadata for quality scores
    full_metadata = pd.read_csv('myDatasets/merged_dataset/metadata/merged_metadata.csv')
    full_metadata = full_metadata[full_metadata['is_duplicate'] == False]
    
    # Merge to get quality scores
    df = df.merge(
        full_metadata[['image_id', 'quality_score']], 
        on='image_id', 
        how='left'
    )
    
    # Filter by quality threshold
    quality_threshold = 40.0
    high_quality_df = df[df['quality_score'] >= quality_threshold]
    
    print(f"\n📊 Quality Filtering:")
    print(f"  Original images: {len(df)}")
    print(f"  Quality threshold: {quality_threshold}")
    print(f"  High quality images: {len(high_quality_df)}")
    print(f"  Filtered out: {len(df) - len(high_quality_df)} ({((len(df) - len(high_quality_df)) / len(df) * 100):.1f}%)")
    
    # Save filtered list
    output_path = Path('myDatasets/merged_dataset/metadata/high_quality_images.csv')
    high_quality_df.to_csv(output_path, index=False)
    print(f"\n✓ Saved high-quality image list to {output_path}\n")


def example_export_class_subset():
    """
    Example 7: Export specific classes only
    """
    print("EXAMPLE 7: Export Class Subset")
    print("=" * 80)
    
    metadata_path = Path('myDatasets/merged_dataset/metadata/split_files_list.csv')
    
    if not metadata_path.exists():
        print("❌ Merged dataset not found. Run a merge first!")
        return
    
    df = pd.read_csv(metadata_path)
    
    # Define classes to export
    target_classes = [
        'healthy',
        'early blight',
        'late blight'
    ]
    
    # Filter by classes
    subset_df = df[df['canonical_class'].isin(target_classes)]
    
    print(f"\n📊 Class Subset Export:")
    print(f"  Target classes: {', '.join(target_classes)}")
    print(f"  Total images: {len(subset_df)}")
    
    for cls in target_classes:
        count = len(subset_df[subset_df['canonical_class'] == cls])
        print(f"    {cls}: {count} images")
    
    # Save subset
    output_path = Path('myDatasets/merged_dataset/metadata/class_subset.csv')
    subset_df.to_csv(output_path, index=False)
    print(f"\n✓ Saved class subset to {output_path}\n")


def example_check_duplicates():
    """
    Example 8: Analyze duplicate detection results
    """
    print("EXAMPLE 8: Duplicate Analysis")
    print("=" * 80)
    
    dup_path = Path('myDatasets/merged_dataset/reports/duplicates_report.csv')
    
    if not dup_path.exists():
        print("❌ Duplicates report not found. Run a merge first!")
        return
    
    df = pd.read_csv(dup_path)
    
    print(f"\n📊 Duplicate Detection Results:")
    print(f"  Total duplicate pairs: {len(df)}")
    
    # Group by primary image
    dup_groups = df.groupby('primary_image_id').size()
    print(f"  Unique primary images: {len(dup_groups)}")
    print(f"  Max duplicates per image: {dup_groups.max()}")
    print(f"  Mean duplicates per image: {dup_groups.mean():.2f}")
    
    # Quality comparison
    quality_diff = df['primary_quality'] - df['duplicate_quality']
    print(f"\n⭐ Quality Score Differences:")
    print(f"  Mean difference: {quality_diff.mean():.2f}")
    print(f"  Max difference: {quality_diff.max():.2f}")
    print(f"  Cases where duplicate was higher quality: {len(quality_diff[quality_diff < 0])}")
    
    # Find cases where we might want to review
    suspicious = df[quality_diff < -5]  # Duplicate was much better quality
    if len(suspicious) > 0:
        print(f"\n⚠️  Suspicious cases (duplicate significantly better): {len(suspicious)}")
        print("  You may want to review these manually.")
    
    print("\n✓ Duplicate analysis complete!\n")


def main():
    """Run example demonstrations."""
    print("\n" + "=" * 80)
    print("DATASET MERGER - PROGRAMMATIC USAGE EXAMPLES")
    print("=" * 80 + "\n")
    
    print("Choose an example to run:")
    print("  1. Basic merge (default settings)")
    print("  2. Custom split ratios")
    print("  3. Strict deduplication")
    print("  4. Analysis only (no file copying)")
    print("  5. Post-merge statistics")
    print("  6. Filter by quality threshold")
    print("  7. Export specific classes")
    print("  8. Analyze duplicate detection")
    print("  0. Exit")
    
    choice = input("\nEnter choice (0-8): ").strip()
    
    examples = {
        '1': example_basic_merge,
        '2': example_custom_splits,
        '3': example_strict_deduplication,
        '4': example_analysis_only,
        '5': example_post_merge_analysis,
        '6': example_filter_by_quality,
        '7': example_export_class_subset,
        '8': example_check_duplicates,
    }
    
    if choice == '0':
        print("\nExiting.\n")
        return
    
    if choice in examples:
        print("\n")
        examples[choice]()
    else:
        print("\n❌ Invalid choice!\n")


if __name__ == "__main__":
    main()
