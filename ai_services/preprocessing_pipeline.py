"""
Standardized Preprocessing Pipeline for Plant Disease Classification
====================================================================

This module provides a comprehensive preprocessing pipeline that ensures
consistent, high-quality inputs for training and inference.

Features:
- Unified transformations (training + inference)
- 224×224 resolution standardization
- RGB-only color handling
- Dataset-specific normalization
- Quality filtering and flagging
- Label encoding
- Metadata integration

Author: Preprocessing Pipeline Architect
Date: December 10, 2025
"""

import os
import json
import warnings
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union, Any
from dataclasses import dataclass, asdict
from collections import defaultdict

import numpy as np
import pandas as pd
from PIL import Image, ImageStat
import cv2
from tqdm import tqdm

warnings.filterwarnings('ignore')


@dataclass
class PreprocessingConfig:
    """Configuration for preprocessing pipeline."""
    
    # Resolution settings
    target_size: Tuple[int, int] = (224, 224)
    resize_method: str = "aspect_preserving"  # aspect_preserving, direct
    
    # Color handling
    color_mode: str = "RGB"
    drop_alpha: bool = True
    drop_multispectral: bool = True
    
    # Normalization
    normalize: bool = True
    normalization_mode: str = "dataset_specific"  # dataset_specific, imagenet, custom
    
    # Quality filtering
    enable_quality_filter: bool = True
    blur_threshold: float = 100.0  # Laplacian variance
    brightness_min: float = 10.0
    brightness_max: float = 245.0
    remove_low_quality: bool = False  # Flag only by default
    
    # Optional enhancements
    enable_contrast_normalization: bool = False
    enable_denoising: bool = False
    enable_histogram_equalization: bool = False
    
    # Label encoding
    encode_labels: bool = True
    start_index: int = 0  # Class ID starts from 0
    
    # Processing
    batch_size: int = 100
    num_workers: int = 4
    random_seed: int = 42
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, config_dict: Dict):
        """Create from dictionary."""
        return cls(**config_dict)
    
    def save(self, path: Union[str, Path]):
        """Save configuration to JSON."""
        with open(path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, path: Union[str, Path]):
        """Load configuration from JSON."""
        with open(path, 'r') as f:
            return cls.from_dict(json.load(f))


class PreprocessingPipeline:
    """
    Standardized preprocessing pipeline for plant disease images.
    
    Ensures consistent transformations at training and inference time.
    """
    
    def __init__(self, config: Optional[PreprocessingConfig] = None):
        """
        Initialize preprocessing pipeline.
        
        Args:
            config: Preprocessing configuration
        """
        self.config = config or PreprocessingConfig()
        
        # Normalization statistics (computed from dataset)
        self.mean = None
        self.std = None
        
        # Label mapping
        self.class_to_id = {}
        self.id_to_class = {}
        
        # Quality flags
        self.quality_flags = {}
        
        # Statistics
        self.stats = {
            'total_processed': 0,
            'rgb_conversions': 0,
            'quality_flagged': 0,
            'quality_removed': 0,
            'resolution_changes': 0
        }
    
    def resize_aspect_preserving(self, image: np.ndarray, 
                                 target_size: Tuple[int, int]) -> np.ndarray:
        """
        Resize image preserving aspect ratio, then center crop.
        
        Args:
            image: Input image (H, W, C)
            target_size: Target size (H, W)
            
        Returns:
            Resized and cropped image
        """
        h, w = image.shape[:2]
        target_h, target_w = target_size
        
        # Calculate resize ratio (resize longer side to target)
        scale = max(target_h / h, target_w / w)
        new_h = int(h * scale)
        new_w = int(w * scale)
        
        # Resize
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Center crop
        start_h = (new_h - target_h) // 2
        start_w = (new_w - target_w) // 2
        cropped = resized[start_h:start_h + target_h, start_w:start_w + target_w]
        
        return cropped
    
    def convert_to_rgb(self, image: Union[Image.Image, np.ndarray]) -> np.ndarray:
        """
        Convert image to RGB format.
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            RGB image as numpy array (H, W, 3)
        """
        # Convert PIL to numpy if needed
        if isinstance(image, Image.Image):
            image = np.array(image)
        
        # Handle different channel configurations
        if len(image.shape) == 2:
            # Grayscale -> RGB
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
            self.stats['rgb_conversions'] += 1
        elif len(image.shape) == 3:
            channels = image.shape[2]
            
            if channels == 1:
                # Single channel -> RGB
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
                self.stats['rgb_conversions'] += 1
            elif channels == 4:
                # RGBA -> RGB (drop alpha)
                image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
                self.stats['rgb_conversions'] += 1
            elif channels > 4:
                # Multispectral -> RGB (take first 3 channels)
                image = image[:, :, :3]
                self.stats['rgb_conversions'] += 1
            # channels == 3 is already RGB
        
        return image
    
    def assess_quality(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Assess image quality using multiple metrics.
        
        Args:
            image: RGB image (H, W, 3)
            
        Returns:
            Dictionary with quality metrics
        """
        # Convert to grayscale for some metrics
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # 1. Blur detection (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 2. Brightness analysis
        brightness = np.mean(gray)
        
        # 3. Contrast (standard deviation)
        contrast = np.std(gray)
        
        # 4. Check for corrupted pixels
        has_nan = np.isnan(image).any()
        has_inf = np.isinf(image).any()
        
        # Quality assessment
        is_blurry = laplacian_var < self.config.blur_threshold
        is_too_dark = brightness < self.config.brightness_min
        is_too_bright = brightness > self.config.brightness_max
        is_corrupted = has_nan or has_inf
        is_low_contrast = contrast < 10.0
        
        is_low_quality = (is_blurry or is_too_dark or is_too_bright or 
                         is_corrupted or is_low_contrast)
        
        return {
            'blur_score': float(laplacian_var),
            'is_blurry': is_blurry,
            'brightness': float(brightness),
            'is_too_dark': is_too_dark,
            'is_too_bright': is_too_bright,
            'contrast': float(contrast),
            'is_low_contrast': is_low_contrast,
            'is_corrupted': is_corrupted,
            'is_low_quality': is_low_quality
        }
    
    def apply_optional_enhancements(self, image: np.ndarray) -> np.ndarray:
        """
        Apply optional preprocessing enhancements.
        
        Args:
            image: RGB image (H, W, 3)
            
        Returns:
            Enhanced image
        """
        # Contrast normalization (CLAHE)
        if self.config.enable_contrast_normalization:
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            lab = cv2.merge([l, a, b])
            image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        # Denoising
        if self.config.enable_denoising:
            image = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
        
        # Histogram equalization
        if self.config.enable_histogram_equalization:
            # Apply to each channel
            image = np.stack([
                cv2.equalizeHist(image[:, :, i]) 
                for i in range(3)
            ], axis=2)
        
        return image
    
    def normalize_image(self, image: np.ndarray) -> np.ndarray:
        """
        Normalize image using computed statistics.
        
        Args:
            image: RGB image (H, W, 3), values in [0, 255]
            
        Returns:
            Normalized image, float32
        """
        if not self.config.normalize:
            return image.astype(np.float32) / 255.0
        
        # Convert to float and scale to [0, 1]
        image = image.astype(np.float32) / 255.0
        
        if self.mean is not None and self.std is not None:
            # Apply (x - mean) / std
            image = (image - self.mean) / self.std
        
        return image
    
    def preprocess_image(self, image_path: Union[str, Path],
                        skip_normalization: bool = False) -> Tuple[np.ndarray, Dict]:
        """
        Apply complete preprocessing pipeline to a single image.
        
        Args:
            image_path: Path to image file
            skip_normalization: Skip normalization step (for computing stats)
            
        Returns:
            Tuple of (preprocessed_image, metadata)
        """
        image_path = Path(image_path)
        
        # Load image
        try:
            image = Image.open(image_path)
            original_size = image.size  # (W, H)
            original_mode = image.mode
        except Exception as e:
            raise ValueError(f"Failed to load image {image_path}: {e}")
        
        # Convert to numpy array
        image = np.array(image)
        
        # Convert to RGB
        image = self.convert_to_rgb(image)
        
        # Assess quality before preprocessing
        quality_metrics = self.assess_quality(image)
        
        # Resize to target resolution
        if image.shape[:2] != self.config.target_size:
            image = self.resize_aspect_preserving(image, self.config.target_size)
            self.stats['resolution_changes'] += 1
        
        # Apply optional enhancements
        image = self.apply_optional_enhancements(image)
        
        # Normalize (unless skipped for statistics computation)
        if not skip_normalization:
            image = self.normalize_image(image)
        
        # Update statistics
        self.stats['total_processed'] += 1
        if quality_metrics['is_low_quality']:
            self.stats['quality_flagged'] += 1
        
        # Metadata
        metadata = {
            'original_size': original_size,
            'original_mode': original_mode,
            'final_size': self.config.target_size,
            'rgb_converted': original_mode != 'RGB',
            **quality_metrics
        }
        
        return image, metadata
    
    def compute_normalization_stats(self, image_paths: List[Union[str, Path]],
                                   sample_size: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute mean and std for dataset normalization.
        
        Args:
            image_paths: List of image file paths
            sample_size: Sample size for computation (None = use all)
            
        Returns:
            Tuple of (mean, std) as numpy arrays of shape (3,)
        """
        print("\n" + "=" * 80)
        print("COMPUTING NORMALIZATION STATISTICS")
        print("=" * 80)
        
        # Sample if requested
        if sample_size and sample_size < len(image_paths):
            np.random.seed(self.config.random_seed)
            image_paths = np.random.choice(image_paths, sample_size, replace=False)
            print(f"\nUsing sample of {sample_size} images")
        
        print(f"\nProcessing {len(image_paths)} images...")
        
        # Accumulate pixel values
        pixel_sum = np.zeros(3, dtype=np.float64)
        pixel_sq_sum = np.zeros(3, dtype=np.float64)
        pixel_count = 0
        
        for img_path in tqdm(image_paths, desc="Computing stats"):
            try:
                # Preprocess without normalization
                image, _ = self.preprocess_image(img_path, skip_normalization=True)
                
                # Convert to [0, 1] range
                image = image.astype(np.float32) / 255.0
                
                # Accumulate
                pixel_sum += image.sum(axis=(0, 1))
                pixel_sq_sum += (image ** 2).sum(axis=(0, 1))
                pixel_count += image.shape[0] * image.shape[1]
                
            except Exception as e:
                print(f"  ⚠ Error processing {Path(img_path).name}: {e}")
                continue
        
        # Compute mean and std
        mean = pixel_sum / pixel_count
        std = np.sqrt(pixel_sq_sum / pixel_count - mean ** 2)
        
        # Store
        self.mean = mean
        self.std = std
        
        print(f"\n✓ Normalization statistics computed:")
        print(f"   Mean (R, G, B): [{mean[0]:.6f}, {mean[1]:.6f}, {mean[2]:.6f}]")
        print(f"   Std  (R, G, B): [{std[0]:.6f}, {std[1]:.6f}, {std[2]:.6f}]")
        
        return mean, std
    
    def build_label_mapping(self, labels: List[str]) -> Dict[str, int]:
        """
        Build label to ID mapping.
        
        Args:
            labels: List of unique class labels
            
        Returns:
            Dictionary mapping label -> ID
        """
        unique_labels = sorted(set(labels))
        
        self.class_to_id = {
            label: idx + self.config.start_index 
            for idx, label in enumerate(unique_labels)
        }
        
        self.id_to_class = {
            idx: label 
            for label, idx in self.class_to_id.items()
        }
        
        print(f"\n✓ Label mapping created: {len(self.class_to_id)} classes")
        
        return self.class_to_id
    
    def encode_label(self, label: str) -> int:
        """Encode label to ID."""
        if label not in self.class_to_id:
            raise ValueError(f"Unknown label: {label}")
        return self.class_to_id[label]
    
    def decode_label(self, label_id: int) -> str:
        """Decode ID to label."""
        if label_id not in self.id_to_class:
            raise ValueError(f"Unknown label ID: {label_id}")
        return self.id_to_class[label_id]


class DatasetPreprocessor:
    """
    Complete dataset preprocessing system.
    
    Processes entire datasets with quality filtering, metadata tracking,
    and statistics computation.
    """
    
    def __init__(self, dataset_path: Union[str, Path],
                 output_path: Union[str, Path],
                 config: Optional[PreprocessingConfig] = None):
        """
        Initialize dataset preprocessor.
        
        Args:
            dataset_path: Path to input dataset
            output_path: Path for preprocessed output
            config: Preprocessing configuration
        """
        self.dataset_path = Path(dataset_path)
        self.output_path = Path(output_path)
        self.config = config or PreprocessingConfig()
        
        # Create output directories
        self.output_path.mkdir(parents=True, exist_ok=True)
        self.metadata_dir = self.output_path / "metadata"
        self.metadata_dir.mkdir(exist_ok=True)
        
        # Initialize pipeline
        self.pipeline = PreprocessingPipeline(self.config)
        
        # Data storage
        self.image_metadata = []
        self.low_quality_images = []
    
    def scan_dataset(self, metadata_csv: Optional[Union[str, Path]] = None) -> pd.DataFrame:
        """
        Scan dataset and load metadata.
        
        Args:
            metadata_csv: Path to existing metadata CSV (optional)
            
        Returns:
            DataFrame with image information
        """
        print("\n" + "=" * 80)
        print("SCANNING DATASET")
        print("=" * 80)
        
        if metadata_csv and Path(metadata_csv).exists():
            print(f"\nLoading metadata from {metadata_csv}")
            df = pd.read_csv(metadata_csv)
        else:
            print(f"\nScanning directory: {self.dataset_path}")
            
            # Find all images
            image_files = []
            for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif']:
                image_files.extend(self.dataset_path.rglob(f"*{ext}"))
                image_files.extend(self.dataset_path.rglob(f"*{ext.upper()}"))
            
            # Extract information
            data = []
            for img_path in image_files:
                # Try to extract class from directory structure
                rel_path = img_path.relative_to(self.dataset_path)
                parts = rel_path.parts[:-1]
                
                # Skip split folders
                split_names = {'train', 'val', 'valid', 'validation', 'test', 'holdout'}
                class_label = "unknown"
                for part in reversed(parts):
                    if part.lower() not in split_names:
                        class_label = part
                        break
                
                data.append({
                    'image_path': str(img_path),
                    'filename': img_path.name,
                    'canonical_class': class_label
                })
            
            df = pd.DataFrame(data)
        
        print(f"\n✓ Found {len(df)} images")
        print(f"✓ Classes: {df['canonical_class'].nunique()}")
        
        return df
    
    def process_dataset(self, metadata_df: pd.DataFrame,
                       compute_normalization: bool = True,
                       save_processed_images: bool = False) -> pd.DataFrame:
        """
        Process entire dataset.
        
        Args:
            metadata_df: DataFrame with image information
            compute_normalization: Whether to compute normalization stats
            save_processed_images: Whether to save preprocessed images
            
        Returns:
            Updated DataFrame with preprocessing metadata
        """
        print("\n" + "=" * 80)
        print("PREPROCESSING DATASET")
        print("=" * 80)
        
        # Step 1: Compute normalization statistics
        if compute_normalization:
            image_paths = metadata_df['image_path'].tolist()
            self.pipeline.compute_normalization_stats(image_paths)
        
        # Step 2: Build label mapping
        if self.config.encode_labels:
            labels = metadata_df['canonical_class'].tolist()
            self.pipeline.build_label_mapping(labels)
        
        # Step 3: Process images
        print("\n" + "=" * 80)
        print("PROCESSING IMAGES")
        print("=" * 80)
        
        processed_metadata = []
        
        for idx, row in tqdm(metadata_df.iterrows(), total=len(metadata_df),
                            desc="Processing images"):
            try:
                # Preprocess image
                image, img_metadata = self.pipeline.preprocess_image(row['image_path'])
                
                # Encode label
                if self.config.encode_labels:
                    label_id = self.pipeline.encode_label(row['canonical_class'])
                else:
                    label_id = None
                
                # Save processed image if requested
                if save_processed_images:
                    output_dir = self.output_path / "images" / row['canonical_class']
                    output_dir.mkdir(parents=True, exist_ok=True)
                    output_file = output_dir / row['filename']
                    
                    # Convert back to uint8 for saving
                    if image.dtype == np.float32:
                        # Denormalize if needed
                        if self.pipeline.mean is not None:
                            image = image * self.pipeline.std + self.pipeline.mean
                        image = (np.clip(image, 0, 1) * 255).astype(np.uint8)
                    
                    cv2.imwrite(str(output_file), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
                
                # Track low quality images
                if img_metadata['is_low_quality']:
                    self.low_quality_images.append({
                        'image_path': row['image_path'],
                        'filename': row['filename'],
                        'canonical_class': row['canonical_class'],
                        **{k: v for k, v in img_metadata.items() 
                           if k.startswith('is_') or k.startswith('blur_') or 
                           k == 'brightness' or k == 'contrast'}
                    })
                
                # Compile metadata
                processed_metadata.append({
                    'image_path': row['image_path'],
                    'filename': row['filename'],
                    'canonical_class': row['canonical_class'],
                    'label_id': label_id,
                    'original_width': img_metadata['original_size'][0],
                    'original_height': img_metadata['original_size'][1],
                    'original_mode': img_metadata['original_mode'],
                    'final_width': img_metadata['final_size'][0],
                    'final_height': img_metadata['final_size'][1],
                    'rgb_converted': img_metadata['rgb_converted'],
                    'blur_score': img_metadata['blur_score'],
                    'brightness': img_metadata['brightness'],
                    'contrast': img_metadata['contrast'],
                    'is_blurry': img_metadata['is_blurry'],
                    'is_too_dark': img_metadata['is_too_dark'],
                    'is_too_bright': img_metadata['is_too_bright'],
                    'is_low_contrast': img_metadata['is_low_contrast'],
                    'is_corrupted': img_metadata['is_corrupted'],
                    'is_low_quality': img_metadata['is_low_quality']
                })
                
            except Exception as e:
                print(f"\n  ⚠ Error processing {row['filename']}: {e}")
                continue
        
        # Create DataFrame
        processed_df = pd.DataFrame(processed_metadata)
        
        # Remove low quality images if configured
        if self.config.remove_low_quality:
            original_count = len(processed_df)
            processed_df = processed_df[~processed_df['is_low_quality']]
            removed_count = original_count - len(processed_df)
            self.pipeline.stats['quality_removed'] = removed_count
            print(f"\n⚠ Removed {removed_count} low-quality images")
        
        print(f"\n✓ Processing complete:")
        print(f"   Total processed: {self.pipeline.stats['total_processed']}")
        print(f"   RGB conversions: {self.pipeline.stats['rgb_conversions']}")
        print(f"   Quality flagged: {self.pipeline.stats['quality_flagged']}")
        print(f"   Quality removed: {self.pipeline.stats['quality_removed']}")
        
        return processed_df
    
    def save_outputs(self, processed_df: pd.DataFrame):
        """
        Save all preprocessing outputs.
        
        Args:
            processed_df: DataFrame with preprocessing metadata
        """
        print("\n" + "=" * 80)
        print("SAVING OUTPUTS")
        print("=" * 80)
        
        # 1. Save configuration
        config_path = self.output_path / "preprocessing_config.json"
        self.config.save(config_path)
        print(f"\n✓ Saved configuration: {config_path}")
        
        # 2. Save normalization statistics
        if self.pipeline.mean is not None:
            norm_df = pd.DataFrame({
                'channel': ['R', 'G', 'B'],
                'mean': self.pipeline.mean,
                'std': self.pipeline.std
            })
            norm_path = self.metadata_dir / "dataset_mean_std.csv"
            norm_df.to_csv(norm_path, index=False)
            print(f"✓ Saved normalization stats: {norm_path}")
        
        # 3. Save label mapping
        if self.config.encode_labels and self.pipeline.class_to_id:
            label_df = pd.DataFrame([
                {'class_name': label, 'class_id': idx}
                for label, idx in self.pipeline.class_to_id.items()
            ])
            label_path = self.metadata_dir / "label_map.csv"
            label_df.to_csv(label_path, index=False)
            print(f"✓ Saved label mapping: {label_path}")
        
        # 4. Save low quality report
        if self.low_quality_images:
            lq_df = pd.DataFrame(self.low_quality_images)
            lq_path = self.metadata_dir / "low_quality_report.csv"
            lq_df.to_csv(lq_path, index=False)
            print(f"✓ Saved low quality report: {lq_path}")
        
        # 5. Save updated metadata
        metadata_path = self.metadata_dir / "preprocessing_metadata.csv"
        processed_df.to_csv(metadata_path, index=False)
        print(f"✓ Saved preprocessing metadata: {metadata_path}")
        
        # 6. Save preprocessing rationale
        self._save_rationale()
        
        print("\n" + "=" * 80)
        print("✅ ALL OUTPUTS SAVED")
        print("=" * 80)
        print(f"\nOutput directory: {self.output_path}")
    
    def _save_rationale(self):
        """Save preprocessing rationale documentation."""
        rationale_path = self.output_path / "preprocessing_rationale.md"
        
        with open(rationale_path, 'w') as f:
            f.write("# Preprocessing Pipeline Rationale\n\n")
            f.write("## Overview\n\n")
            f.write("This document explains the preprocessing strategies applied to ")
            f.write("the plant disease classification dataset.\n\n")
            
            f.write("## 1. Resolution Standardization\n\n")
            f.write(f"**Target Size**: {self.config.target_size[0]}×{self.config.target_size[1]}\n\n")
            f.write("**Method**: Aspect-preserving resize + center crop\n\n")
            f.write("**Rationale**: This approach:\n")
            f.write("- Preserves aspect ratio to avoid distortion\n")
            f.write("- Ensures consistent input size for the model\n")
            f.write("- Minimizes information loss\n")
            f.write("- Centers the subject (typically the diseased area)\n\n")
            
            f.write("## 2. Color Handling\n\n")
            f.write(f"**Mode**: {self.config.color_mode}\n\n")
            f.write("**Rationale**:\n")
            f.write("- RGB provides sufficient color information for disease detection\n")
            f.write("- Drops alpha channels (transparency not relevant)\n")
            f.write("- Converts multispectral to RGB (model expects 3 channels)\n")
            f.write("- Grayscale images converted to RGB for consistency\n\n")
            
            f.write("## 3. Normalization\n\n")
            if self.pipeline.mean is not None:
                f.write(f"**Mean (R, G, B)**: [{self.pipeline.mean[0]:.6f}, ")
                f.write(f"{self.pipeline.mean[1]:.6f}, {self.pipeline.mean[2]:.6f}]\n\n")
                f.write(f"**Std (R, G, B)**: [{self.pipeline.std[0]:.6f}, ")
                f.write(f"{self.pipeline.std[1]:.6f}, {self.pipeline.std[2]:.6f}]\n\n")
            
            f.write("**Method**: Dataset-specific (x - mean) / std\n\n")
            f.write("**Rationale**:\n")
            f.write("- Computed from the actual training data distribution\n")
            f.write("- Zero-centers the data\n")
            f.write("- Scales to unit variance\n")
            f.write("- Improves gradient flow during training\n")
            f.write("- More appropriate than ImageNet stats for plant diseases\n\n")
            
            f.write("## 4. Quality Filtering\n\n")
            f.write(f"**Blur Threshold**: {self.config.blur_threshold}\n")
            f.write(f" (Laplacian variance)\n\n")
            f.write(f"**Brightness Range**: [{self.config.brightness_min}, ")
            f.write(f"{self.config.brightness_max}]\n\n")
            f.write(f"**Remove Low Quality**: {self.config.remove_low_quality}\n\n")
            f.write("**Rationale**:\n")
            f.write("- Flags blurry, over/under-exposed, or corrupted images\n")
            f.write("- Allows manual review before removal\n")
            f.write("- Prevents training on poor quality data\n")
            f.write("- Maintains data quality standards\n\n")
            
            f.write("## 5. Training vs Inference Consistency\n\n")
            f.write("**Identical Steps**:\n")
            f.write("- Resize and crop\n")
            f.write("- RGB conversion\n")
            f.write("- Normalization (same mean/std)\n\n")
            f.write("**Training-Only Steps**:\n")
            f.write("- Data augmentation (random flips, rotations, etc.)\n")
            f.write("- Applied BEFORE normalization\n\n")
            f.write("**Rationale**:\n")
            f.write("- Ensures model sees similar data at training and inference\n")
            f.write("- Prevents train-test distribution mismatch\n")
            f.write("- Augmentation only for training diversity\n\n")
            
            f.write("## 6. Label Encoding\n\n")
            if self.pipeline.class_to_id:
                f.write(f"**Number of Classes**: {len(self.pipeline.class_to_id)}\n\n")
                f.write(f"**Start Index**: {self.config.start_index}\n\n")
            f.write("**Rationale**:\n")
            f.write("- Converts string labels to integer IDs\n")
            f.write("- Required for neural network loss functions\n")
            f.write("- Maintains bidirectional mapping for interpretation\n")
            f.write("- Sorted alphabetically for consistency\n\n")
            
            f.write("## 7. Optional Enhancements\n\n")
            f.write(f"**Contrast Normalization**: {self.config.enable_contrast_normalization}\n\n")
            f.write(f"**Denoising**: {self.config.enable_denoising}\n\n")
            f.write(f"**Histogram Equalization**: {self.config.enable_histogram_equalization}\n\n")
            f.write("**Rationale**:\n")
            f.write("- Disabled by default to preserve original data\n")
            f.write("- Can be enabled for experimental branches\n")
            f.write("- CLAHE improves contrast in varying lighting\n")
            f.write("- Denoising removes sensor noise\n")
            f.write("- Histogram equalization enhances details\n\n")
            
            f.write("## Statistics\n\n")
            f.write(f"- Total images processed: {self.pipeline.stats['total_processed']}\n")
            f.write(f"- RGB conversions: {self.pipeline.stats['rgb_conversions']}\n")
            f.write(f"- Quality flagged: {self.pipeline.stats['quality_flagged']}\n")
            f.write(f"- Quality removed: {self.pipeline.stats['quality_removed']}\n")
            f.write(f"- Resolution changes: {self.pipeline.stats['resolution_changes']}\n\n")
            
            f.write("---\n\n")
            f.write("**Date**: December 10, 2025\n")
            f.write("**Author**: Preprocessing Pipeline Architect\n")
        
        print(f"✓ Saved preprocessing rationale: {rationale_path}")
    
    def run(self, metadata_csv: Optional[Union[str, Path]] = None,
            save_images: bool = False) -> pd.DataFrame:
        """
        Run complete preprocessing pipeline.
        
        Args:
            metadata_csv: Path to existing metadata CSV (optional)
            save_images: Whether to save preprocessed images
            
        Returns:
            DataFrame with preprocessing metadata
        """
        print("\n" + "=" * 80)
        print("PREPROCESSING PIPELINE")
        print("=" * 80)
        print(f"\nDataset: {self.dataset_path}")
        print(f"Output: {self.output_path}")
        
        # Scan dataset
        metadata_df = self.scan_dataset(metadata_csv)
        
        # Process dataset
        processed_df = self.process_dataset(metadata_df, save_processed_images=save_images)
        
        # Save outputs
        self.save_outputs(processed_df)
        
        print("\n✅ Preprocessing pipeline completed successfully!\n")
        
        return processed_df


def main():
    """Main entry point for preprocessing pipeline."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Standardized preprocessing pipeline for plant disease images"
    )
    parser.add_argument(
        '--dataset-path',
        type=str,
        required=True,
        help='Path to input dataset'
    )
    parser.add_argument(
        '--output-path',
        type=str,
        default=None,
        help='Path for preprocessed output (default: dataset_path/preprocessed)'
    )
    parser.add_argument(
        '--metadata-csv',
        type=str,
        default=None,
        help='Path to existing metadata CSV'
    )
    parser.add_argument(
        '--save-images',
        action='store_true',
        help='Save preprocessed images'
    )
    parser.add_argument(
        '--config',
        type=str,
        default=None,
        help='Path to preprocessing config JSON'
    )
    parser.add_argument(
        '--remove-low-quality',
        action='store_true',
        help='Remove low quality images (default: flag only)'
    )
    
    args = parser.parse_args()
    
    # Load or create config
    if args.config:
        config = PreprocessingConfig.load(args.config)
    else:
        config = PreprocessingConfig()
    
    # Override with command-line args
    if args.remove_low_quality:
        config.remove_low_quality = True
    
    # Set output path
    output_path = args.output_path or Path(args.dataset_path) / "preprocessed"
    
    # Create preprocessor
    preprocessor = DatasetPreprocessor(
        dataset_path=args.dataset_path,
        output_path=output_path,
        config=config
    )
    
    # Run pipeline
    preprocessor.run(
        metadata_csv=args.metadata_csv,
        save_images=args.save_images
    )


if __name__ == "__main__":
    main()
