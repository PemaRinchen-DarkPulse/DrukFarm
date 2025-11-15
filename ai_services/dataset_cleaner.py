"""
Post-Analysis Data Cleaning Workflow
Use this template after running dataset_curator.py to clean your datasets
based on the analysis results.
"""

import os
import shutil
import pandas as pd
from pathlib import Path
from collections import defaultdict
import json


class DatasetCleaner:
    """Clean datasets based on curator analysis results"""
    
    def __init__(self, analysis_output_dir, datasets_root):
        self.analysis_dir = Path(analysis_output_dir)
        self.datasets_root = Path(datasets_root)
        self.backup_dir = Path(datasets_root).parent / "dataset_backups"
        
        # Load analysis results
        self.load_analysis_results()
    
    def load_analysis_results(self):
        """Load CSV files from analysis"""
        print("Loading analysis results...")
        
        self.exact_duplicates = pd.read_csv(
            self.analysis_dir / "duplicates" / "exact_duplicates_md5.csv"
        )
        
        try:
            self.quality_issues = pd.read_csv(
                self.analysis_dir / "statistics" / "quality_issues.csv"
            )
        except:
            self.quality_issues = pd.DataFrame()
        
        try:
            self.label_mapping = pd.read_csv(
                self.analysis_dir / "statistics" / "label_mapping.csv"
            )
        except:
            self.label_mapping = pd.DataFrame()
        
        print("✓ Analysis results loaded")
    
    def backup_datasets(self):
        """Create backup of all datasets before cleaning"""
        print("\n" + "="*70)
        print("CREATING BACKUP")
        print("="*70)
        
        if self.backup_dir.exists():
            response = input(f"\nBackup already exists at {self.backup_dir}. Overwrite? (y/n): ")
            if response.lower() != 'y':
                print("Skipping backup...")
                return
        
        print(f"\nBacking up datasets to: {self.backup_dir}")
        
        self.backup_dir.mkdir(exist_ok=True)
        
        for dataset_folder in self.datasets_root.iterdir():
            if dataset_folder.is_dir():
                backup_path = self.backup_dir / dataset_folder.name
                print(f"  Backing up: {dataset_folder.name}")
                
                if backup_path.exists():
                    shutil.rmtree(backup_path)
                
                shutil.copytree(dataset_folder, backup_path)
        
        print("\n✓ Backup complete!")
    
    def remove_exact_duplicates(self, dry_run=True):
        """Remove exact duplicate images (keeping one copy)"""
        print("\n" + "="*70)
        print("REMOVING EXACT DUPLICATES")
        print("="*70)
        
        if len(self.exact_duplicates) == 0:
            print("No exact duplicates found!")
            return
        
        # Group by duplicate group
        groups = self.exact_duplicates.groupby('Duplicate Group')
        
        removed_count = 0
        
        for group_id, group_df in groups:
            # Sort by size (keep largest) then by dataset name
            sorted_group = group_df.sort_values(['Size (KB)', 'Dataset'], 
                                                ascending=[False, True])
            
            # Keep first, remove others
            to_keep = sorted_group.iloc[0]
            to_remove = sorted_group.iloc[1:]
            
            print(f"\nGroup {group_id}:")
            print(f"  Keeping: {to_keep['Filename']} ({to_keep['Size (KB)']} KB)")
            
            for _, img in to_remove.iterrows():
                print(f"  Removing: {img['Filename']} from {img['Dataset']}")
                
                if not dry_run:
                    img_path = Path(img['Path'])
                    if img_path.exists():
                        img_path.unlink()
                        removed_count += 1
        
        if dry_run:
            print(f"\n[DRY RUN] Would remove {len(self.exact_duplicates) - len(groups)} duplicate images")
            print("Run with dry_run=False to actually remove files")
        else:
            print(f"\n✓ Removed {removed_count} duplicate images")
    
    def remove_quality_issues(self, issue_types=['Unreadable'], dry_run=True):
        """Remove images with specific quality issues"""
        print("\n" + "="*70)
        print("REMOVING QUALITY ISSUES")
        print("="*70)
        
        if len(self.quality_issues) == 0:
            print("No quality issues found!")
            return
        
        to_remove = self.quality_issues[
            self.quality_issues['Issue Type'].isin(issue_types)
        ]
        
        print(f"\nRemoving images with issues: {', '.join(issue_types)}")
        print(f"Total images to remove: {len(to_remove)}")
        
        removed_count = 0
        
        for _, img in to_remove.iterrows():
            print(f"  {img['Issue Type']}: {img['Path']}")
            
            if not dry_run:
                img_path = Path(img['Path'])
                if img_path.exists():
                    img_path.unlink()
                    removed_count += 1
        
        if dry_run:
            print(f"\n[DRY RUN] Would remove {len(to_remove)} images")
            print("Run with dry_run=False to actually remove files")
        else:
            print(f"\n✓ Removed {removed_count} images")
    
    def rename_labels_from_mapping(self, mapping_dict, dry_run=True):
        """Rename class folders based on standardized mapping
        
        Args:
            mapping_dict: Dictionary like {'old_label': 'new_label'}
            dry_run: If True, only show what would be changed
        """
        print("\n" + "="*70)
        print("RENAMING LABELS")
        print("="*70)
        
        renamed_count = 0
        
        for old_label, new_label in mapping_dict.items():
            print(f"\nMapping: '{old_label}' -> '{new_label}'")
            
            # Find all folders with old label name
            for dataset_folder in self.datasets_root.iterdir():
                if not dataset_folder.is_dir():
                    continue
                
                # Search for class folders
                old_label_paths = list(dataset_folder.rglob(old_label))
                
                for old_path in old_label_paths:
                    if old_path.is_dir():
                        new_path = old_path.parent / new_label
                        
                        print(f"  {dataset_folder.name}: {old_path.name} -> {new_path.name}")
                        
                        if not dry_run:
                            if new_path.exists():
                                # Merge folders
                                for item in old_path.iterdir():
                                    shutil.move(str(item), str(new_path))
                                old_path.rmdir()
                            else:
                                old_path.rename(new_path)
                            
                            renamed_count += 1
        
        if dry_run:
            print(f"\n[DRY RUN] Would rename {renamed_count} folders")
            print("Run with dry_run=False to actually rename")
        else:
            print(f"\n✓ Renamed {renamed_count} folders")
    
    def generate_cleaning_report(self):
        """Generate report of cleaning actions taken"""
        print("\n" + "="*70)
        print("GENERATING CLEANING REPORT")
        print("="*70)
        
        report = {
            'timestamp': pd.Timestamp.now().isoformat(),
            'exact_duplicates_found': len(self.exact_duplicates),
            'quality_issues_found': len(self.quality_issues),
            'quality_issue_types': self.quality_issues['Issue Type'].value_counts().to_dict() if len(self.quality_issues) > 0 else {},
            'recommendations': []
        }
        
        # Add recommendations
        if len(self.exact_duplicates) > 0:
            report['recommendations'].append(
                f"Remove {len(self.exact_duplicates)} exact duplicate images"
            )
        
        if len(self.quality_issues) > 0:
            report['recommendations'].append(
                f"Review {len(self.quality_issues)} quality issues"
            )
        
        # Save report
        report_path = self.analysis_dir / "cleaning_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"✓ Cleaning report saved: {report_path}")
        
        return report


def main():
    """Example workflow"""
    
    # Paths
    ANALYSIS_DIR = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\dataset_analysis_output"
    DATASETS_ROOT = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\myDatasets"
    
    # Create cleaner
    cleaner = DatasetCleaner(ANALYSIS_DIR, DATASETS_ROOT)
    
    # Step 1: Always backup first!
    print("\n⚠️  IMPORTANT: This will modify your dataset files!")
    print("It's recommended to create a backup first.")
    response = input("\nCreate backup now? (y/n): ")
    
    if response.lower() == 'y':
        cleaner.backup_datasets()
    
    # Step 2: Remove exact duplicates (dry run first)
    print("\n\n=== STEP 1: REMOVE EXACT DUPLICATES ===")
    cleaner.remove_exact_duplicates(dry_run=True)
    
    response = input("\nProceed with removal? (y/n): ")
    if response.lower() == 'y':
        cleaner.remove_exact_duplicates(dry_run=False)
    
    # Step 3: Remove quality issues (dry run first)
    print("\n\n=== STEP 2: REMOVE QUALITY ISSUES ===")
    
    # Specify which issue types to remove
    issue_types_to_remove = ['Unreadable', 'Too Small']
    
    cleaner.remove_quality_issues(issue_types=issue_types_to_remove, dry_run=True)
    
    response = input("\nProceed with removal? (y/n): ")
    if response.lower() == 'y':
        cleaner.remove_quality_issues(issue_types=issue_types_to_remove, dry_run=False)
    
    # Step 4: Standardize labels (dry run first)
    print("\n\n=== STEP 3: STANDARDIZE LABELS ===")
    
    # Example: Create your own mapping based on label_conflicts.csv
    label_mapping = {
        # 'old_name': 'standardized_name',
        # Example:
        # 'bacterial_blight': 'blight_bacterial',
        # 'early_blight': 'blight_early',
    }
    
    if label_mapping:
        cleaner.rename_labels_from_mapping(label_mapping, dry_run=True)
        
        response = input("\nProceed with renaming? (y/n): ")
        if response.lower() == 'y':
            cleaner.rename_labels_from_mapping(label_mapping, dry_run=False)
    else:
        print("No label mapping defined. Edit this script to add mappings.")
    
    # Step 5: Generate report
    print("\n\n=== GENERATING REPORT ===")
    cleaner.generate_cleaning_report()
    
    print("\n" + "="*70)
    print("CLEANING WORKFLOW COMPLETE!")
    print("="*70)
    print("\nNext steps:")
    print("1. Re-run dataset_curator.py to verify changes")
    print("2. Check dataset_analysis_output/cleaning_report.json")
    print("3. Proceed with model training pipeline")


if __name__ == "__main__":
    main()
