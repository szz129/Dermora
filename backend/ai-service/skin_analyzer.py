"""
Dermora Skin Analyzer - EfficientNet-B2
Replaces the Google Derm Foundation placeholder with the actual
fine-tuned EfficientNet-B2 model (96.94% accuracy, 6 classes)
"""
 
import os
import logging
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b2, EfficientNet_B2_Weights
from PIL import Image
import cv2
from typing import Optional
 
logger = logging.getLogger(__name__)
 
# ── Class mapping from training ──────────────────────────────────────────────
# Exact order from: train_dataset.class_to_idx
# {'acne': 0, 'dark_spots': 1, 'hyperpigmentation': 2,
#  'melasma': 3, 'normal_skin': 4, 'redness': 5}
CLASS_NAMES = [
    'acne',
    'dark_spots',
    'hyperpigmentation',
    'melasma',
    'normal_skin',
    'redness'
]
 
# Health score deductions per condition
CONDITION_DEDUCTIONS = {
    'acne':               25,
    'dark_spots':         15,
    'hyperpigmentation':  15,
    'melasma':            20,
    'normal_skin':         0,
    'redness':            15,
}
 
# Human-readable labels for the frontend
CONDITION_LABELS = {
    'acne':               'Acne',
    'dark_spots':         'Dark Spots',
    'hyperpigmentation':  'Hyperpigmentation',
    'melasma':            'Melasma',
    'normal_skin':        'Normal Skin',
    'redness':            'Redness / Irritation',
}
 
# Recommendations per condition
CONDITION_RECOMMENDATIONS = {
    'acne': [
        {'title': 'Use a salicylic acid cleanser twice daily'},
        {'title': 'Apply a non-comedogenic moisturizer'},
        {'title': 'Use sunscreen every morning — SPF 50+'},
        {'title': 'Avoid touching your face and change pillowcases weekly'},
    ],
    'dark_spots': [
        {'title': 'Apply Vitamin C serum every morning'},
        {'title': 'Use an AHA/glycolic acid toner 2-3 times a week'},
        {'title': 'Sunscreen is essential — SPF 50+ daily'},
        {'title': 'Be consistent — results take 6-8 weeks'},
    ],
    'hyperpigmentation': [
        {'title': 'Use a niacinamide serum morning and night'},
        {'title': 'Apply a brightening moisturizer with alpha arbutin'},
        {'title': 'Protect with SPF 50+ sunscreen every day'},
        {'title': 'Consider a kojic acid or tranexamic acid treatment'},
    ],
    'melasma': [
        {'title': 'Use a tranexamic acid or kojic acid serum'},
        {'title': 'SPF 50+ sunscreen is non-negotiable — reapply every 2 hours'},
        {'title': 'Use a gentle brightening moisturizer with niacinamide'},
        {'title': 'Hormonal melasma may need dermatologist consultation'},
    ],
    'normal_skin': [
        {'title': 'Maintain your routine — cleanser, moisturizer, SPF'},
        {'title': 'Add a Vitamin C serum for antioxidant protection'},
        {'title': 'Stay hydrated and use SPF 50+ daily'},
        {'title': 'Your skin is healthy — focus on prevention'},
    ],
    'redness': [
        {'title': 'Use a gentle, fragrance-free cleanser'},
        {'title': 'Apply a centella asiatica or azelaic acid serum'},
        {'title': 'Use a barrier repair moisturizer with ceramides'},
        {'title': 'Avoid hot water, harsh scrubs, and fragranced products'},
    ],
}
 
 
class DermoraAnalyzer:
    """
    EfficientNet-B2 based skin condition analyzer.
    Replaces the Google Derm Foundation placeholder.
    """
 
    # Expose condition list for /model/info endpoint
    SKIN_CONDITIONS = CLASS_NAMES
 
    def __init__(self):
        self.model = None
        self.device = 'cpu'
        self.model_name = 'EfficientNet-B2 (Fine-tuned, 6 classes)'
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        self._load_model()
 
    def _load_model(self):
        """Load EfficientNet-B2 from local .pth file."""
        # Look for model in multiple locations
        possible_paths = [
            os.path.join(os.path.dirname(__file__), 'models', 'efficientnet_b2_best.pth'),
            os.path.join(os.path.dirname(__file__), 'efficientnet_b2_best.pth'),
            os.getenv('MODEL_PATH', ''),
        ]
 
        model_path = None
        for path in possible_paths:
            if path and os.path.exists(path):
                model_path = path
                break
 
        if not model_path:
            logger.error(
                "EfficientNet-B2 model not found! "
                "Place efficientnet_b2_best.pth in backend/ai-service/models/"
            )
            return
 
        try:
            logger.info(f"Loading EfficientNet-B2 from: {model_path}")
 
            # Set device
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            logger.info(f"Using device: {self.device}")
 
            # Build model architecture (must match training)
            model = efficientnet_b2(weights=None)
            model.classifier[1] = nn.Linear(
                model.classifier[1].in_features, 6
            )
 
            # Load saved weights
            state_dict = torch.load(model_path, map_location=self.device)
 
            # Handle both raw state_dict and checkpoint dict
            if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
                state_dict = state_dict['model_state_dict']
 
            model.load_state_dict(state_dict)
            model.eval()
            model.to(self.device)
 
            self.model = model
            logger.info("✅ EfficientNet-B2 loaded successfully!")
 
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None
 
    def analyze_image(self, image: np.ndarray) -> dict:
        """
        Run EfficientNet-B2 inference on a preprocessed image.
 
        Args:
            image: numpy array (H, W, 3) BGR or RGB, already preprocessed
 
        Returns:
            dict with detected_conditions, overall_health_score, recommendations
        """
        if self.model is None:
            logger.warning("Model not loaded — returning fallback heuristic result")
            return self._heuristic_fallback(image)
 
        try:
            # Convert numpy BGR (OpenCV) → PIL RGB
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8)
 
            # Handle BGR → RGB conversion
            if len(image.shape) == 3 and image.shape[2] == 3:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image).convert('RGB')
 
            # Apply transforms
            tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
 
            # Run inference
            with torch.no_grad():
                outputs = self.model(tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
 
            probs = probabilities.cpu().numpy()
 
            # Get predicted class
            predicted_idx = int(np.argmax(probs))
            predicted_class = CLASS_NAMES[predicted_idx]
            predicted_confidence = float(probs[predicted_idx])
 
            logger.info(
                f"Prediction: {predicted_class} "
                f"(confidence: {predicted_confidence:.2%})"
            )
 
            # Build detected_conditions dict
            # Primary condition is the top prediction
            # Show all confidences for frontend reference
            detected_conditions = {}
            for i, cls in enumerate(CLASS_NAMES):
                confidence = float(probs[i])
                is_detected = (i == predicted_idx)
                detected_conditions[cls] = {
                    'detected': is_detected,
                    'confidence': round(confidence, 4),
                    'label': CONDITION_LABELS[cls],
                }
 
            # Calculate health score
            health_score = self._calculate_health_score(
                predicted_class, predicted_confidence
            )
 
            # Get recommendations for detected condition
            recommendations = CONDITION_RECOMMENDATIONS.get(
                predicted_class,
                CONDITION_RECOMMENDATIONS['normal_skin']
            )
 
            return {
                'success': True,
                'detected_conditions': detected_conditions,
                'primary_condition': predicted_class,
                'primary_confidence': predicted_confidence,
                'overall_health_score': health_score,
                'recommendations': recommendations,
                'all_probabilities': {
                    cls: round(float(probs[i]), 4)
                    for i, cls in enumerate(CLASS_NAMES)
                }
            }
 
        except Exception as e:
            logger.error(f"Inference error: {e}")
            return self._get_error_response(str(e))
 
    def _calculate_health_score(
        self, condition: str, confidence: float
    ) -> int:
        """
        Calculate skin health score based on detected condition.
        Score range: 30-100
        """
        base_score = 100
        deduction = CONDITION_DEDUCTIONS.get(condition, 10)
 
        # Scale deduction by confidence
        # High confidence → full deduction
        # Low confidence → partial deduction
        scaled_deduction = int(deduction * confidence)
        score = base_score - scaled_deduction
 
        return max(30, min(100, score))
 
    def _heuristic_fallback(self, image: np.ndarray) -> dict:
        """
        Simple OpenCV heuristic fallback when model is not loaded.
        Less accurate but ensures API never crashes.
        """
        logger.warning("Using heuristic fallback — model not loaded")
 
        detected_conditions = {
            cls: {'detected': False, 'confidence': 0.0, 'label': CONDITION_LABELS[cls]}
            for cls in CLASS_NAMES
        }
 
        # Basic redness detection
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        red_mask1 = cv2.inRange(hsv, (0, 50, 50), (10, 255, 255))
        red_mask2 = cv2.inRange(hsv, (170, 50, 50), (180, 255, 255))
        red_pct = (cv2.countNonZero(red_mask1) + cv2.countNonZero(red_mask2)) / image.size
 
        if red_pct > 0.02:
            detected_conditions['redness']['detected'] = True
            detected_conditions['redness']['confidence'] = min(red_pct * 10, 0.9)
            primary = 'redness'
        else:
            detected_conditions['normal_skin']['detected'] = True
            detected_conditions['normal_skin']['confidence'] = 0.7
            primary = 'normal_skin'
 
        return {
            'success': True,
            'detected_conditions': detected_conditions,
            'primary_condition': primary,
            'primary_confidence': detected_conditions[primary]['confidence'],
            'overall_health_score': self._calculate_health_score(primary, 0.7),
            'recommendations': CONDITION_RECOMMENDATIONS[primary],
            'all_probabilities': {cls: 0.0 for cls in CLASS_NAMES}
        }
 
    def _get_error_response(self, error_msg: str) -> dict:
        """Standard error response."""
        return {
            'success': False,
            'error': error_msg,
            'detected_conditions': {},
            'overall_health_score': 0,
            'recommendations': [],
        }
 
 
# Singleton instance
_analyzer_instance: Optional[DermoraAnalyzer] = None
 
 
def get_analyzer() -> DermoraAnalyzer:
    """Get or create the singleton analyzer instance."""
    global _analyzer_instance
    if _analyzer_instance is None:
        logger.info("Initializing DermoraAnalyzer...")
        _analyzer_instance = DermoraAnalyzer()
    return _analyzer_instance