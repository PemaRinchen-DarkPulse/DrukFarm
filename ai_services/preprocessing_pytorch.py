"""
PyTorch Integration for Preprocessing Pipeline
==============================================

Provides PyTorch Dataset and DataLoader integration with
consistent preprocessing for training and inference.

Author: Preprocessing Pipeline Architect
Date: December 10, 2025
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import numpy as np
import pandas as pd
from PIL import Image
from pathlib import Path
from typing import Optional, Tuple, Callable, List

from preprocessing_pipeline import PreprocessingConfig, PreprocessingPipeline


class PlantDiseaseDataset(Dataset):
    """
    PyTorch Dataset for plant disease classification.
    
    Applies consistent preprocessing at training and inference time.
    """
    
    def __init__(self,
                 metadata_csv: str,
                 preprocessing_config: Optional[PreprocessingConfig] = None,
                 normalization_stats: Optional[Tuple[np.ndarray, np.ndarray]] = None,
                 label_map: Optional[dict] = None,
                 augment: bool = False,
                 filter_low_quality: bool = True):
        """
        Initialize dataset.
        
        Args:
            metadata_csv: Path to preprocessing metadata CSV
            preprocessing_config: Preprocessing configuration
            normalization_stats: Tuple of (mean, std) arrays
            label_map: Dictionary mapping class -> ID
            augment: Apply data augmentation (training only)
            filter_low_quality: Exclude low quality images
        """
        self.config = preprocessing_config or PreprocessingConfig()
        self.augment = augment
        
        # Load metadata
        self.metadata = pd.read_csv(metadata_csv)
        
        # Filter low quality if requested
        if filter_low_quality and 'is_low_quality' in self.metadata.columns:
            original_len = len(self.metadata)
            self.metadata = self.metadata[~self.metadata['is_low_quality']]
            print(f"Filtered {original_len - len(self.metadata)} low quality images")
        
        # Load or use provided normalization stats
        if normalization_stats:
            self.mean, self.std = normalization_stats
        else:
            # Try to load from stats file
            stats_path = Path(metadata_csv).parent / "dataset_mean_std.csv"
            if stats_path.exists():
                stats_df = pd.read_csv(stats_path)
                self.mean = stats_df['mean'].values
                self.std = stats_df['std'].values
            else:
                # Default to no normalization (will use [0,1] range)
                self.mean = None
                self.std = None
        
        # Load or use provided label map
        if label_map:
            self.class_to_id = label_map
        else:
            # Try to load from label map file
            label_path = Path(metadata_csv).parent / "label_map.csv"
            if label_path.exists():
                label_df = pd.read_csv(label_path)
                self.class_to_id = dict(zip(label_df['class_name'], label_df['class_id']))
            else:
                # Create from metadata
                unique_classes = sorted(self.metadata['canonical_class'].unique())
                self.class_to_id = {cls: idx for idx, cls in enumerate(unique_classes)}
        
        # Initialize preprocessing pipeline
        self.pipeline = PreprocessingPipeline(self.config)
        self.pipeline.mean = self.mean
        self.pipeline.std = self.std
        self.pipeline.class_to_id = self.class_to_id
        
        # Define augmentation transforms (applied before normalization)
        if self.augment:
            self.aug_transform = transforms.Compose([
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomVerticalFlip(p=0.3),
                transforms.RandomRotation(degrees=20),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
                transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
            ])
        else:
            self.aug_transform = None
    
    def __len__(self) -> int:
        """Return dataset size."""
        return len(self.metadata)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Get preprocessed image and label.
        
        Args:
            idx: Index
            
        Returns:
            Tuple of (image_tensor, label_id)
        """
        row = self.metadata.iloc[idx]
        
        # Load and preprocess image
        image, _ = self.pipeline.preprocess_image(row['image_path'])
        
        # Convert to PIL for augmentation
        if self.augment and self.aug_transform:
            # Denormalize for augmentation
            if self.mean is not None:
                image = image * self.std + self.mean
            image = np.clip(image, 0, 1)
            
            # Convert to PIL
            image = Image.fromarray((image * 255).astype(np.uint8))
            
            # Apply augmentation
            image = self.aug_transform(image)
            
            # Convert back to numpy
            image = np.array(image).astype(np.float32) / 255.0
            
            # Renormalize
            if self.mean is not None:
                image = (image - self.mean) / self.std
        
        # Convert to tensor (C, H, W)
        image = torch.from_numpy(image.transpose(2, 0, 1)).float()
        
        # Get label
        if 'label_id' in row and pd.notna(row['label_id']):
            label = int(row['label_id'])
        else:
            label = self.class_to_id[row['canonical_class']]
        
        return image, label
    
    def get_class_weights(self) -> torch.Tensor:
        """
        Compute class weights for imbalanced datasets.
        
        Returns:
            Tensor of class weights
        """
        class_counts = self.metadata['canonical_class'].value_counts()
        num_samples = len(self.metadata)
        num_classes = len(self.class_to_id)
        
        weights = []
        for cls_name in sorted(self.class_to_id.keys()):
            count = class_counts.get(cls_name, 1)
            weight = num_samples / (num_classes * count)
            weights.append(weight)
        
        return torch.tensor(weights, dtype=torch.float32)


def create_dataloaders(train_csv: str,
                       val_csv: str,
                       test_csv: Optional[str] = None,
                       batch_size: int = 32,
                       num_workers: int = 4,
                       config: Optional[PreprocessingConfig] = None) -> dict:
    """
    Create train, validation, and test DataLoaders.
    
    Args:
        train_csv: Path to training metadata CSV
        val_csv: Path to validation metadata CSV
        test_csv: Path to test metadata CSV (optional)
        batch_size: Batch size
        num_workers: Number of worker processes
        config: Preprocessing configuration
        
    Returns:
        Dictionary with 'train', 'val', and optionally 'test' DataLoaders
    """
    # Load normalization stats (from training set directory)
    stats_path = Path(train_csv).parent / "dataset_mean_std.csv"
    if stats_path.exists():
        stats_df = pd.read_csv(stats_path)
        mean = stats_df['mean'].values
        std = stats_df['std'].values
    else:
        mean, std = None, None
    
    # Load label map
    label_path = Path(train_csv).parent / "label_map.csv"
    if label_path.exists():
        label_df = pd.read_csv(label_path)
        label_map = dict(zip(label_df['class_name'], label_df['class_id']))
    else:
        label_map = None
    
    # Create datasets
    train_dataset = PlantDiseaseDataset(
        metadata_csv=train_csv,
        preprocessing_config=config,
        normalization_stats=(mean, std) if mean is not None else None,
        label_map=label_map,
        augment=True,  # Augmentation for training
        filter_low_quality=True
    )
    
    val_dataset = PlantDiseaseDataset(
        metadata_csv=val_csv,
        preprocessing_config=config,
        normalization_stats=(mean, std) if mean is not None else None,
        label_map=label_map,
        augment=False,  # No augmentation for validation
        filter_low_quality=True
    )
    
    # Create dataloaders
    dataloaders = {
        'train': DataLoader(
            train_dataset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=num_workers,
            pin_memory=True
        ),
        'val': DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=True
        )
    }
    
    # Add test dataloader if provided
    if test_csv:
        test_dataset = PlantDiseaseDataset(
            metadata_csv=test_csv,
            preprocessing_config=config,
            normalization_stats=(mean, std) if mean is not None else None,
            label_map=label_map,
            augment=False,
            filter_low_quality=True
        )
        
        dataloaders['test'] = DataLoader(
            test_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=True
        )
    
    return dataloaders


class InferencePreprocessor:
    """
    Preprocessing for inference (single images).
    
    Ensures same transformations as training.
    """
    
    def __init__(self,
                 mean: np.ndarray,
                 std: np.ndarray,
                 config: Optional[PreprocessingConfig] = None):
        """
        Initialize inference preprocessor.
        
        Args:
            mean: Normalization mean (3,)
            std: Normalization std (3,)
            config: Preprocessing configuration
        """
        self.mean = mean
        self.std = std
        self.config = config or PreprocessingConfig()
        
        # Initialize pipeline
        self.pipeline = PreprocessingPipeline(self.config)
        self.pipeline.mean = mean
        self.pipeline.std = std
    
    def preprocess(self, image_path: str) -> torch.Tensor:
        """
        Preprocess single image for inference.
        
        Args:
            image_path: Path to image
            
        Returns:
            Preprocessed image tensor (1, 3, H, W)
        """
        # Apply same preprocessing as training
        image, _ = self.pipeline.preprocess_image(image_path)
        
        # Convert to tensor
        image = torch.from_numpy(image.transpose(2, 0, 1)).float()
        
        # Add batch dimension
        image = image.unsqueeze(0)
        
        return image
    
    @classmethod
    def from_metadata_dir(cls, metadata_dir: str):
        """
        Create from metadata directory.
        
        Args:
            metadata_dir: Path to metadata directory
            
        Returns:
            InferencePreprocessor instance
        """
        metadata_dir = Path(metadata_dir)
        
        # Load normalization stats
        stats_path = metadata_dir / "dataset_mean_std.csv"
        if stats_path.exists():
            stats_df = pd.read_csv(stats_path)
            mean = stats_df['mean'].values
            std = stats_df['std'].values
        else:
            raise FileNotFoundError(f"Normalization stats not found: {stats_path}")
        
        # Load config
        config_path = metadata_dir.parent / "preprocessing_config.json"
        if config_path.exists():
            config = PreprocessingConfig.load(config_path)
        else:
            config = PreprocessingConfig()
        
        return cls(mean, std, config)


if __name__ == "__main__":
    # Example usage
    print("PyTorch Preprocessing Integration")
    print("=" * 80)
    
    # Create dataloaders
    dataloaders = create_dataloaders(
        train_csv="preprocessed/metadata/preprocessing_metadata_train.csv",
        val_csv="preprocessed/metadata/preprocessing_metadata_val.csv",
        batch_size=32,
        num_workers=4
    )
    
    print(f"\nTrain batches: {len(dataloaders['train'])}")
    print(f"Val batches: {len(dataloaders['val'])}")
    
    # Test inference
    preprocessor = InferencePreprocessor.from_metadata_dir("preprocessed/metadata")
    image = preprocessor.preprocess("path/to/image.jpg")
    print(f"\nInference image shape: {image.shape}")
