"""
Dermora Image Preprocessing Module
Optimized for skin analysis with proper face detection and enhancement
"""

import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional, Dict
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DermoraPreprocessor:
    """
    Advanced image preprocessing for Dermora skin analysis
    Optimized for Pakistani skin tones and lighting conditions
    """
    
    def __init__(self, use_mediapipe: bool = True):
        """
        Initialize preprocessor
        
        Args:
            use_mediapipe: Use MediaPipe for better face detection (recommended)
                          Falls back to Haar Cascade if MediaPipe not available
        """
        self.use_mediapipe = use_mediapipe
        self.face_detector = None
        
        # Try to load MediaPipe first (better accuracy, especially for diverse skin tones)
        if use_mediapipe:
            try:
                import mediapipe as mp
                self.mp_face_detection = mp.solutions.face_detection
                self.face_detector = self.mp_face_detection.FaceDetection(
                    model_selection=1,  # 1 for full range, 0 for close range
                    min_detection_confidence=0.5
                )
                logger.info("✅ Using MediaPipe face detection (high accuracy)")
            except ImportError:
                logger.warning("⚠️  MediaPipe not installed. Falling back to Haar Cascade")
                logger.warning("   Install with: pip install mediapipe")
                self.use_mediapipe = False
        
        # Fallback to Haar Cascade
        if not self.use_mediapipe:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            logger.info("✅ Using Haar Cascade face detection (basic)")
    
    def load_image(self, image_data: bytes) -> np.ndarray:
        """
        Load image from bytes with validation
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Loaded image as numpy array (BGR format)
            
        Raises:
            ValueError: If image cannot be decoded or is invalid
        """
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Could not decode image")
            
            # Validate image
            height, width = image.shape[:2]
            
            if width < 200 or height < 200:
                raise ValueError(f"Image too small: {width}x{height}. Minimum 200x200 required")
            
            if width > 4000 or height > 4000:
                logger.warning(f"Large image detected ({width}x{height}). Resizing for processing...")
                # Resize very large images to prevent memory issues
                scale = min(4000 / width, 4000 / height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            
            return image
            
        except Exception as e:
            raise ValueError(f"Failed to load image: {str(e)}")
    
    def detect_face_mediapipe(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face using MediaPipe (better for diverse skin tones)
        
        Returns:
            (x, y, width, height) or None if no face detected
        """
        try:
            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.face_detector.process(rgb_image)
            
            if not results.detections:
                return None
            
            # Get the most confident detection
            detection = max(results.detections, key=lambda d: d.score[0])
            
            # Extract bounding box
            bbox = detection.location_data.relative_bounding_box
            height, width = image.shape[:2]
            
            x = int(bbox.xmin * width)
            y = int(bbox.ymin * height)
            w = int(bbox.width * width)
            h = int(bbox.height * height)
            
            # Ensure coordinates are within image bounds
            x = max(0, x)
            y = max(0, y)
            w = min(w, width - x)
            h = min(h, height - y)
            
            return (x, y, w, h)
            
        except Exception as e:
            logger.error(f"MediaPipe face detection failed: {e}")
            return None
    
    def detect_face_haar(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face using Haar Cascade (fallback method)
        
        Returns:
            (x, y, width, height) or None if no face detected
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100)
        )
        
        if len(faces) == 0:
            return None
        
        # Return the largest face
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        return tuple(largest_face)
    
    def detect_face(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face using available method
        
        Returns:
            (x, y, width, height) or None if no face detected
        """
        if self.use_mediapipe:
            return self.detect_face_mediapipe(image)
        else:
            return self.detect_face_haar(image)
    
    def check_image_quality(self, image: np.ndarray) -> Dict[str, any]:
        """
        Check image quality metrics
        
        Returns:
            Dictionary with quality metrics:
            - brightness: 0-255 (optimal: 100-180)
            - blur_score: higher is sharper (optimal: >100)
            - is_too_dark: boolean
            - is_too_bright: boolean
            - is_blurry: boolean
            - quality_score: 0-100
        """
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Check brightness
        brightness = np.mean(gray)
        is_too_dark = brightness < 80
        is_too_bright = brightness > 200
        
        # Check blur using Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        is_blurry = blur_score < 100
        
        # Calculate overall quality score
        quality_score = 100
        
        if is_too_dark:
            quality_score -= 30
        elif is_too_bright:
            quality_score -= 20
        
        if brightness < 60 or brightness > 220:
            quality_score -= 20
        
        if is_blurry:
            quality_score -= 40
        
        quality_score = max(0, quality_score)
        
        return {
            "brightness": float(brightness),
            "blur_score": float(blur_score),
            "is_too_dark": bool(is_too_dark),
            "is_too_bright": bool(is_too_bright),
            "is_blurry": bool(is_blurry),
            "quality_score": int(quality_score),
            "quality_level": "good" if quality_score >= 70 else "fair" if quality_score >= 40 else "poor"
        }
    
    def crop_face(self, image: np.ndarray, face_rect: Tuple[int, int, int, int], 
                  padding: float = 0.3) -> np.ndarray:
        """
        Crop image to face region with padding
        
        Args:
            image: Input image
            face_rect: (x, y, width, height)
            padding: Percentage to expand crop (0.3 = 30% larger)
            
        Returns:
            Cropped face image
        """
        x, y, w, h = face_rect
        height, width = image.shape[:2]
        
        # Add padding
        pad_w = int(w * padding)
        pad_h = int(h * padding)
        
        # Calculate crop coordinates
        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(width, x + w + pad_w)
        y2 = min(height, y + h + pad_h)
        
        return image[y1:y2, x1:x2]
    
    def apply_white_balance(self, image: np.ndarray) -> np.ndarray:
        """
        Apply automatic white balance for accurate skin tone
        Critical for analyzing different skin tones correctly
        """
        result = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        avg_a = np.average(result[:, :, 1])
        avg_b = np.average(result[:, :, 2])
        
        result[:, :, 1] = result[:, :, 1] - ((avg_a - 128) * (result[:, :, 0] / 255.0) * 1.1)
        result[:, :, 2] = result[:, :, 2] - ((avg_b - 128) * (result[:, :, 0] / 255.0) * 1.1)
        
        result = cv2.cvtColor(result, cv2.COLOR_LAB2BGR)
        return result
    
    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance image quality for skin analysis
        - Apply white balance (critical for skin tone accuracy)
        - Adjust contrast adaptively
        - Reduce noise without losing detail
        """
        # Apply white balance first (important for skin analysis)
        balanced = self.apply_white_balance(image)
        
        # Convert to LAB color space
        lab = cv2.cvtColor(balanced, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel (contrast enhancement)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge and convert back
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Apply gentle denoising
        denoised = cv2.fastNlMeansDenoisingColored(
            enhanced, 
            None, 
            h=10,  # Filter strength for luminance
            hColor=10,  # Filter strength for color
            templateWindowSize=7,
            searchWindowSize=21
        )
        
        return denoised
    
    def normalize_image(self, image: np.ndarray, 
                       target_size: Tuple[int, int] = (448, 448)) -> np.ndarray:
        """
        Resize and normalize image for Derm Foundation
        
        Args:
            image: Input image
            target_size: Target dimensions (Derm Foundation uses 448x448)
            
        Returns:
            Normalized image
        """
        # Use LANCZOS interpolation for best quality when resizing
        resized = cv2.resize(image, target_size, interpolation=cv2.INTER_LANCZOS4)
        return resized
    
    def preprocess_for_analysis(
        self, 
        image_data: bytes,
        require_face: bool = True,
        enhance: bool = True,
        target_size: Tuple[int, int] = (448, 448)
    ) -> Dict:
        """
        Complete preprocessing pipeline optimized for Dermora
        
        Args:
            image_data: Raw image bytes
            require_face: Fail if no face detected
            enhance: Apply enhancement (recommended)
            target_size: Final image size (448x448 for Derm Foundation)
            
        Returns:
            Dictionary containing:
            - processed_image: Ready for model
            - original_image: Original loaded image
            - face_detected: Boolean
            - face_rect: Face coordinates if detected
            - quality_metrics: Image quality analysis
            - warnings: List of warnings
            - success: Boolean
            - error: Error message if failed
        """
        warnings = []
        
        try:
            # Step 1: Load and validate image
            logger.info("📥 Loading image...")
            image = self.load_image(image_data)
            original_image = image.copy()
            
            # Step 2: Check image quality
            logger.info("🔍 Checking image quality...")
            quality_metrics = self.check_image_quality(image)
            
            if quality_metrics["quality_score"] < 40:
                warnings.append(f"Poor image quality detected ({quality_metrics['quality_level']})")
            
            if quality_metrics["is_too_dark"]:
                warnings.append("Image is too dark. Better lighting recommended.")
            
            if quality_metrics["is_blurry"]:
                warnings.append("Image is blurry. Hold camera steady.")
            
            # Step 3: Detect face
            logger.info("👤 Detecting face...")
            face_rect = self.detect_face(image)
            
            if face_rect is None:
                if require_face:
                    return {
                        "success": False,
                        "error": "No face detected in image",
                        "warnings": ["Please ensure your face is clearly visible and well-lit"],
                        "face_detected": False,
                        "quality_metrics": quality_metrics
                    }
                else:
                    warnings.append("No face detected. Using full image.")
            else:
                logger.info(f"✅ Face detected at {face_rect}")
                # Crop to face
                image = self.crop_face(image, face_rect, padding=0.3)
            
            # Step 4: Enhance image
            if enhance:
                logger.info("✨ Enhancing image...")
                image = self.enhance_image(image)
            
            # Step 5: Normalize for model
            logger.info(f"📐 Resizing to {target_size}...")
            processed_image = self.normalize_image(image, target_size)
            
            logger.info("✅ Preprocessing complete!")
            
            return {
                "success": True,
                "processed_image": processed_image,
                "original_image": original_image,
                "face_detected": bool(face_rect is not None),
                "face_rect": face_rect,
                "quality_metrics": quality_metrics,
                "warnings": warnings,
                "final_size": list(processed_image.shape) if processed_image is not None else None
            }
            
        except Exception as e:
            logger.error(f"❌ Preprocessing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "warnings": warnings,
                "face_detected": False
            }
    
    def preprocess_for_model(
        self,
        image_data: bytes,
        enhance: bool = True,
        target_size: Tuple[int, int] = (224, 224),
        require_face: bool = True
    ) -> Tuple[np.ndarray, Dict]:
        """
        Preprocess image for model input (compatibility method for main.py)
        
        Args:
            image_data: Raw image bytes
            enhance: Apply enhancement (recommended)
            target_size: Final image size (default: 224x224 for compatibility)
            require_face: Fail if no face detected
            
        Returns:
            Tuple of (processed_image, preprocessing_metadata)
            
        Raises:
            ValueError: If preprocessing fails or no face detected (when require_face=True)
        """
        result = self.preprocess_for_analysis(
            image_data=image_data,
            require_face=require_face,
            enhance=enhance,
            target_size=target_size
        )
        
        if not result.get("success", False):
            error_msg = result.get("error", "Preprocessing failed")
            raise ValueError(error_msg)
        
        processed_image = result["processed_image"]
        
        # Create metadata dict from result and convert numpy types
        face_rect = result.get("face_rect")
        if face_rect is not None and isinstance(face_rect, tuple):
            face_rect = list(face_rect)  # Convert tuple to list for JSON serialization
        
        final_size = result.get("final_size")
        if final_size is not None and isinstance(final_size, tuple):
            final_size = list(final_size)
        
        preprocessing_metadata = {
            "face_detected": bool(result.get("face_detected", False)),
            "face_rect": face_rect,
            "quality_metrics": result.get("quality_metrics", {}),
            "warnings": result.get("warnings", []),
            "final_size": final_size,
            "enhanced": bool(enhance),
            "target_size": list(target_size) if isinstance(target_size, tuple) else target_size
        }
        
        return processed_image, preprocessing_metadata
    
    def image_to_bytes(self, image: np.ndarray, format: str = 'JPEG', quality: int = 95) -> bytes:
        """
        Convert numpy array image to bytes
        
        Args:
            image: Image as numpy array
            format: Output format (JPEG or PNG)
            quality: JPEG quality (1-100, only for JPEG)
            
        Returns:
            Image as bytes
        """
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        
        img_byte_arr = io.BytesIO()
        
        if format.upper() == 'JPEG':
            pil_image.save(img_byte_arr, format=format, quality=quality)
        else:
            pil_image.save(img_byte_arr, format=format)
        
        return img_byte_arr.getvalue()


# Singleton instance for efficient memory usage
_preprocessor_instance: Optional[DermoraPreprocessor] = None

def get_preprocessor(use_mediapipe: bool = True) -> DermoraPreprocessor:
    """Get or create the global preprocessor instance"""
    global _preprocessor_instance
    if _preprocessor_instance is None:
        _preprocessor_instance = DermoraPreprocessor(use_mediapipe=use_mediapipe)
    return _preprocessor_instance


# Module-level preprocessor instance for backward compatibility with main.py
preprocessor = get_preprocessor()