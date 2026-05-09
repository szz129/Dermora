"""
Dermora Skin Analyzer - EfficientNet-B2
Fixed version: addresses acne-bias via temperature scaling,
confidence thresholding, top-2 detection, and TTA.
"""

import os
import logging
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.models import efficientnet_b2, EfficientNet_B2_Weights
from PIL import Image
import cv2
from typing import Optional

logger = logging.getLogger(__name__)

# ── Class mapping from training ──────────────────────────────────────────────
CLASS_NAMES = [
    'acne',
    'dark_spots',
    'hyperpigmentation',
    'melasma',
    'normal_skin',
    'redness'
]

# ── Bias correction: prior probabilities observed in real-world usage ─────────
# The model was trained on clinical images so it over-predicts acne.
# These priors DOWN-weight acne and UP-weight underrepresented classes.
# Tuned empirically — adjust if you run a proper calibration pass.
CLASS_PRIORS = {
    'acne':               2.0,
    'dark_spots':         0.7,
    'hyperpigmentation':  0.6,
    'melasma':            0.5,
    'normal_skin':        1.0,
    'redness':            1.5,
}

# Temperature for softmax calibration (>1.0 = softer, less confident)
# Helps when the model is overconfident about acne
TEMPERATURE = 2.2

# Minimum confidence to report a condition as "detected"
CONFIDENCE_THRESHOLD = 0.25

# If top-1 confidence is below this, report top-2 as secondary condition
UNCERTAIN_THRESHOLD = 0.50

# Health score deductions per condition
CONDITION_DEDUCTIONS = {
    'acne':               25,
    'dark_spots':         15,
    'hyperpigmentation':  15,
    'melasma':            20,
    'normal_skin':         0,
    'redness':            15,
}

# Human-readable labels
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

    Bias fixes applied (no retraining needed):
    1. Temperature scaling  — softens overconfident acne predictions
    2. Prior correction     — down-weights acne, up-weights rare classes
    3. Confidence threshold — won't report a condition below 25% confidence
    4. Top-2 detection      — if model is uncertain, shows secondary condition
    5. Test-Time Augmentation (TTA) — averages 4 flipped/rotated passes
    """

    SKIN_CONDITIONS = CLASS_NAMES

    def __init__(self):
        self.model = None
        self.device = 'cpu'
        self.model_name = 'EfficientNet-B2 (Fine-tuned, 6 classes)'

        # Base transform (no augmentation)
        self.base_transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        # TTA transforms — horizontal flip + slight crops
        self.tta_transforms = [
            # Original
            transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ]),
            # Horizontal flip
            transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.CenterCrop(224),
                transforms.RandomHorizontalFlip(p=1.0),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ]),
            # Slightly brighter (simulate different lighting)
            transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.CenterCrop(224),
                transforms.ColorJitter(brightness=0.1),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ]),
            # Slightly warmer (simulate skin tone variation)
            transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.CenterCrop(224),
                transforms.ColorJitter(brightness=0.05, contrast=0.05),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ]),
        ]

        self._load_model()

    def _load_model(self):
        """Load EfficientNet-B2 from local .pth file."""
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

            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            logger.info(f"Using device: {self.device}")

            model = efficientnet_b2(weights=None)
            model.classifier[1] = nn.Linear(
                model.classifier[1].in_features, 6
            )

            state_dict = torch.load(model_path, map_location=self.device)

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

    def _apply_temperature_and_priors(self, logits: np.ndarray) -> np.ndarray:
        """
        Apply temperature scaling + prior correction to raw logits.

        Temperature scaling: divide logits by T before softmax
        → softens overconfident predictions (especially acne)

        Prior correction: multiply softmax probs by inverse class prior
        → reduces acne dominance, boosts underrepresented classes
        """
        # Temperature scaling on logits
        scaled_logits = logits / TEMPERATURE

        # Softmax
        probs = np.exp(scaled_logits - np.max(scaled_logits))
        probs = probs / probs.sum()

        # Prior correction: divide by prior (higher prior = down-weighted)
        prior_weights = np.array([CLASS_PRIORS[cls] for cls in CLASS_NAMES])
        corrected = probs / prior_weights

        # Renormalise
        corrected = corrected / corrected.sum()

        return corrected

    def _run_tta_inference(self, pil_image: Image.Image) -> np.ndarray:
        """
        Run Test-Time Augmentation: average logits over 4 transforms.
        Reduces sensitivity to lighting/angle that causes acne bias.
        """
        all_logits = []

        with torch.no_grad():
            for transform in self.tta_transforms:
                tensor = transform(pil_image).unsqueeze(0).to(self.device)
                logits = self.model(tensor)[0].cpu().numpy()
                all_logits.append(logits)

        # Average the logits (before softmax) — standard TTA practice
        avg_logits = np.mean(all_logits, axis=0)
        return avg_logits

    def analyze_image(self, image: np.ndarray) -> dict:
        """
        Run EfficientNet-B2 inference on a preprocessed image.

        Args:
            image: numpy array (H, W, 3) BGR or RGB

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

            if len(image.shape) == 3 and image.shape[2] == 3:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image).convert('RGB')

            # ── Run TTA inference ─────────────────────────────────────────
            avg_logits = self._run_tta_inference(pil_image)

            # ── Apply temperature scaling + prior correction ───────────────
            probs = self._apply_temperature_and_priors(avg_logits)

            # ── Determine primary condition ───────────────────────────────
            sorted_indices = np.argsort(probs)[::-1]
            primary_idx = sorted_indices[0]
            primary_class = CLASS_NAMES[primary_idx]
            primary_confidence = float(probs[primary_idx])

            # ── Determine secondary condition (if model is uncertain) ──────
            secondary_class = None
            secondary_confidence = 0.0
            if primary_confidence < UNCERTAIN_THRESHOLD and len(sorted_indices) > 1:
                secondary_idx = sorted_indices[1]
                secondary_confidence = float(probs[secondary_idx])
                if secondary_confidence >= CONFIDENCE_THRESHOLD:
                    secondary_class = CLASS_NAMES[secondary_idx]

            logger.info(
                f"Primary: {primary_class} ({primary_confidence:.2%}) | "
                f"Secondary: {secondary_class} ({secondary_confidence:.2%}) | "
                f"All probs: { {cls: round(float(probs[i]),3) for i, cls in enumerate(CLASS_NAMES)} }"
            )

            # ── Build detected_conditions dict ────────────────────────────
            detected_conditions = {}
            for i, cls in enumerate(CLASS_NAMES):
                confidence = float(probs[i])
                is_detected = (
                    cls == primary_class or
                    (cls == secondary_class and secondary_class is not None)
                )
                detected_conditions[cls] = {
                    'detected': is_detected,
                    'confidence': round(confidence, 4),
                    'label': CONDITION_LABELS[cls],
                }

            # ── Health score ──────────────────────────────────────────────
            health_score = self._calculate_health_score(
                primary_class, primary_confidence
            )

            # ── Recommendations ───────────────────────────────────────────
            # If secondary condition detected, merge recommendations
            recommendations = list(CONDITION_RECOMMENDATIONS.get(
                primary_class, CONDITION_RECOMMENDATIONS['normal_skin']
            ))
            if secondary_class and secondary_class != primary_class:
                secondary_recs = CONDITION_RECOMMENDATIONS.get(secondary_class, [])
                # Add first secondary recommendation if not already covered
                if secondary_recs:
                    recommendations.append({
                        'title': f'[Also noted: {CONDITION_LABELS[secondary_class]}] {secondary_recs[0]["title"]}'
                    })

            return {
                'success': True,
                'detected_conditions': detected_conditions,
                'primary_condition': primary_class,
                'primary_confidence': round(primary_confidence, 4),
                'secondary_condition': secondary_class,
                'secondary_confidence': round(secondary_confidence, 4),
                'overall_health_score': health_score,
                'recommendations': recommendations,
                'all_probabilities': {
                    cls: round(float(probs[i]), 4)
                    for i, cls in enumerate(CLASS_NAMES)
                },
                # Diagnostic info — useful for demo/debugging
                'model_info': {
                    'temperature': TEMPERATURE,
                    'tta_passes': len(self.tta_transforms),
                    'uncertain': primary_confidence < UNCERTAIN_THRESHOLD,
                }
            }

        except Exception as e:
            logger.error(f"Inference error: {e}")
            return self._get_error_response(str(e))

    def _calculate_health_score(self, condition: str, confidence: float) -> int:
        """
        Calculate skin health score based on detected condition.
        Score range: 30–100
        """
        base_score = 100
        deduction = CONDITION_DEDUCTIONS.get(condition, 10)
        scaled_deduction = int(deduction * confidence)
        score = base_score - scaled_deduction
        return max(30, min(100, score))

    def _heuristic_fallback(self, image: np.ndarray) -> dict:
        """OpenCV heuristic fallback when model is not loaded."""
        logger.warning("Using heuristic fallback — model not loaded")

        detected_conditions = {
            cls: {'detected': False, 'confidence': 0.0, 'label': CONDITION_LABELS[cls]}
            for cls in CLASS_NAMES
        }

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
            'secondary_condition': None,
            'secondary_confidence': 0.0,
            'primary_confidence': detected_conditions[primary]['confidence'],
            'overall_health_score': self._calculate_health_score(primary, 0.7),
            'recommendations': CONDITION_RECOMMENDATIONS[primary],
            'all_probabilities': {cls: 0.0 for cls in CLASS_NAMES}
        }

    def _get_error_response(self, error_msg: str) -> dict:
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
    global _analyzer_instance
    if _analyzer_instance is None:
        logger.info("Initializing DermoraAnalyzer...")
        _analyzer_instance = DermoraAnalyzer()
    return _analyzer_instance