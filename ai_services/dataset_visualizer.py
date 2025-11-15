"""
Dataset Analysis Visualizer
Creates visual summaries of the dataset curation results
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)


class DatasetVisualizer:
    """Generate visualizations from curator outputs"""
    
    def __init__(self, analysis_output_dir):
        self.output_dir = Path(analysis_output_dir)
        self.viz_dir = self.output_dir / "visualizations"
        self.viz_dir.mkdir(exist_ok=True)
        
        # Load data
        self.load_data()
    
    def load_data(self):
        """Load CSV files from analysis"""
        print("Loading analysis data...")
        
        self.master_manifest = pd.read_csv(
            self.output_dir / "manifests" / "master_manifest.csv"
        )
        
        self.class_distribution = pd.read_csv(
            self.output_dir / "statistics" / "class_distribution.csv"
        )
        
        self.resolution_stats = pd.read_csv(
            self.output_dir / "statistics" / "resolution_statistics.csv"
        )
        
        try:
            self.quality_issues = pd.read_csv(
                self.output_dir / "statistics" / "quality_issues.csv"
            )
        except:
            self.quality_issues = None
        
        print("✓ Data loaded successfully")
    
    def plot_dataset_sizes(self):
        """Bar chart of dataset sizes"""
        plt.figure(figsize=(14, 6))
        
        datasets = self.master_manifest['Dataset Name']
        counts = self.master_manifest['Total Images']
        
        plt.bar(range(len(datasets)), counts, color='steelblue', alpha=0.8)
        plt.xticks(range(len(datasets)), datasets, rotation=45, ha='right')
        plt.xlabel('Dataset', fontsize=12)
        plt.ylabel('Number of Images', fontsize=12)
        plt.title('Dataset Size Distribution', fontsize=14, fontweight='bold')
        plt.tight_layout()
        
        output_path = self.viz_dir / "dataset_sizes.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Saved: {output_path.name}")
    
    def plot_class_distribution(self, top_n=30):
        """Bar chart of top classes"""
        plt.figure(figsize=(14, 8))
        
        top_classes = self.class_distribution.head(top_n)
        
        plt.barh(range(len(top_classes)), top_classes['Total Images'], 
                color='forestgreen', alpha=0.8)
        plt.yticks(range(len(top_classes)), top_classes['Class Label'])
        plt.xlabel('Number of Images', fontsize=12)
        plt.ylabel('Class Label', fontsize=12)
        plt.title(f'Top {top_n} Classes by Image Count', fontsize=14, fontweight='bold')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        
        output_path = self.viz_dir / "class_distribution_top30.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Saved: {output_path.name}")
    
    def plot_resolution_distribution(self):
        """Box plot of resolution ranges"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        datasets = self.resolution_stats['Dataset']
        
        # Width distribution
        widths_data = [
            [row['Min Width'], row['Median Width'], row['Max Width']]
            for _, row in self.resolution_stats.iterrows()
        ]
        
        ax1.boxplot([w for w in zip(*widths_data)], labels=['Min', 'Median', 'Max'])
        ax1.set_ylabel('Width (pixels)', fontsize=12)
        ax1.set_title('Image Width Distribution', fontsize=13, fontweight='bold')
        ax1.grid(axis='y', alpha=0.3)
        
        # Height distribution
        heights_data = [
            [row['Min Height'], row['Median Height'], row['Max Height']]
            for _, row in self.resolution_stats.iterrows()
        ]
        
        ax2.boxplot([h for h in zip(*heights_data)], labels=['Min', 'Median', 'Max'])
        ax2.set_ylabel('Height (pixels)', fontsize=12)
        ax2.set_title('Image Height Distribution', fontsize=13, fontweight='bold')
        ax2.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        
        output_path = self.viz_dir / "resolution_distribution.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Saved: {output_path.name}")
    
    def plot_quality_issues(self):
        """Pie chart of quality issue types"""
        if self.quality_issues is None or len(self.quality_issues) == 0:
            print("⚠ No quality issues data available")
            return
        
        plt.figure(figsize=(10, 10))
        
        issue_counts = self.quality_issues['Issue Type'].value_counts()
        
        colors = plt.cm.Set3(range(len(issue_counts)))
        
        plt.pie(issue_counts.values, labels=issue_counts.index, autopct='%1.1f%%',
                startangle=90, colors=colors)
        plt.title('Distribution of Quality Issues', fontsize=14, fontweight='bold')
        
        output_path = self.viz_dir / "quality_issues.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Saved: {output_path.name}")
    
    def plot_dataset_class_overlap(self):
        """Heatmap showing which datasets contain which classes"""
        # This is more complex - create a matrix
        class_labels = self.class_distribution['Class Label'].head(20).tolist()
        
        # Parse dataset names from the 'Datasets' column
        matrix_data = []
        
        for _, row in self.class_distribution.head(20).iterrows():
            dataset_names = [d.strip() for d in row['Datasets'].split(',')]
            row_data = [1 if any(ds in name for ds in dataset_names) 
                       else 0 for name in self.master_manifest['Dataset Name']]
            matrix_data.append(row_data)
        
        plt.figure(figsize=(14, 10))
        
        sns.heatmap(matrix_data, 
                   xticklabels=[name[:30] for name in self.master_manifest['Dataset Name']],
                   yticklabels=class_labels,
                   cmap='YlGnBu', cbar_kws={'label': 'Present'},
                   linewidths=0.5)
        
        plt.xlabel('Dataset', fontsize=12)
        plt.ylabel('Class (Top 20)', fontsize=12)
        plt.title('Class-Dataset Overlap Matrix', fontsize=14, fontweight='bold')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        output_path = self.viz_dir / "class_dataset_overlap.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Saved: {output_path.name}")
    
    def generate_summary_stats(self):
        """Generate summary statistics JSON"""
        stats = {
            'total_datasets': len(self.master_manifest),
            'total_images': int(self.master_manifest['Total Images'].sum()),
            'total_classes': len(self.class_distribution),
            'avg_images_per_dataset': float(self.master_manifest['Total Images'].mean()),
            'avg_images_per_class': float(self.class_distribution['Total Images'].mean()),
            'most_common_class': {
                'name': self.class_distribution.iloc[0]['Class Label'],
                'count': int(self.class_distribution.iloc[0]['Total Images'])
            },
            'datasets': self.master_manifest['Dataset Name'].tolist()
        }
        
        if self.quality_issues is not None:
            stats['quality_issues_count'] = len(self.quality_issues)
            stats['quality_issues_by_type'] = self.quality_issues['Issue Type'].value_counts().to_dict()
        
        output_path = self.viz_dir / "summary_statistics.json"
        with open(output_path, 'w') as f:
            json.dump(stats, f, indent=2)
        
        print(f"✓ Saved: {output_path.name}")
        
        return stats
    
    def create_all_visualizations(self):
        """Generate all visualizations"""
        print("\n" + "="*70)
        print("GENERATING VISUALIZATIONS")
        print("="*70 + "\n")
        
        self.plot_dataset_sizes()
        self.plot_class_distribution()
        self.plot_resolution_distribution()
        self.plot_quality_issues()
        self.plot_dataset_class_overlap()
        stats = self.generate_summary_stats()
        
        print("\n" + "="*70)
        print("VISUALIZATION COMPLETE")
        print("="*70)
        print(f"\nAll visualizations saved to: {self.viz_dir}")
        print(f"\nQuick Stats:")
        print(f"  Total Datasets: {stats['total_datasets']}")
        print(f"  Total Images: {stats['total_images']:,}")
        print(f"  Total Classes: {stats['total_classes']}")
        print(f"  Most Common: {stats['most_common_class']['name']} ({stats['most_common_class']['count']:,} images)")


def main():
    """Main execution"""
    analysis_dir = r"c:\Users\pemar\Documents\My Projects\DrukFarm\ai_services\dataset_analysis_output"
    
    visualizer = DatasetVisualizer(analysis_dir)
    visualizer.create_all_visualizations()


if __name__ == "__main__":
    main()
