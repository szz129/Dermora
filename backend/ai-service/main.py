"""
FastAPI Server for Skin Analysis
Provides REST API endpoints for skin image analysis
"""

import os
<<<<<<< HEAD
import math
import logging
import cv2
import numpy as np
import io

=======
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
from dotenv import load_dotenv
<<<<<<< HEAD

from image_preprocessing import preprocessor
from skin_analyzer import get_analyzer, CONDITION_RECOMMENDATIONS
=======
import logging
import cv2
import numpy as np
import io

from image_preprocessing import preprocessor
from skin_analyzer import get_analyzer
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641

# Load environment variables
load_dotenv()

<<<<<<< HEAD
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────────────────────

def _convert_numpy_types(obj):
    """Recursively convert numpy types to native Python types for JSON serialization."""
=======

def _convert_numpy_types(obj):
    """
    Recursively convert numpy types to native Python types for JSON serialization
    """
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: _convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_convert_numpy_types(item) for item in obj]
    return obj


<<<<<<< HEAD
def _apply_color_correction(image: np.ndarray, result: dict) -> dict:
    """
    Post-processing correction for all 6 skin conditions.
    
    Only activates when model confidence < 55% (uncertain predictions).
    Uses LAB colour space to distinguish conditions by their visual signatures:
    
    - Acne:               red inflamed spots (high A channel, localised)
    - Dark spots:         small concentrated dark patches (low L, small area)
    - Hyperpigmentation:  diffuse darkening across large area (low-mid L, spread out)
    - Melasma:            brown patches on cheeks/forehead (brown B channel, large area)
    - Normal skin:        even tone, no dominant colour deviation
    - Redness:            broad red flush (high A channel, large area)
    
    Decision logic:
    1. Measure brown_ratio  → melasma/hyperpigmentation signal
    2. Measure red_ratio    → acne/redness signal  
    3. Measure dark_ratio   → dark spots signal
    4. Only override if the measured signal strongly contradicts model prediction
    """
    confidence = result.get('primary_confidence', 1.0)
    primary = result.get('primary_condition', '')

    # Only intervene when model is uncertain
    if confidence > 0.70:
        return result

    try:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        total_pixels = image.shape[0] * image.shape[1]

        # ── Signal 1: Brown pigmentation (melasma / hyperpigmentation) ──────
        # Brown = moderate lightness + warm yellow-brown B channel
        brown_mask = cv2.inRange(lab, np.array([30, 125, 135]), np.array([180, 148, 175]))
        brown_ratio = cv2.countNonZero(brown_mask) / total_pixels

        # ── Signal 2: True redness (acne inflammation / redness flush) ───────
        # Red = high A channel (red-green axis in LAB)
        red_mask = cv2.inRange(lab, np.array([0, 135, 100]), np.array([255, 175, 152]))
        red_ratio = cv2.countNonZero(red_mask) / total_pixels

        # ── Signal 3: Localised dark spots ────────────────────────────────────
        # Dark spots = very low L channel (dark pixels), small concentrated areas
        dark_mask = cv2.inRange(lab, np.array([0, 110, 110]), np.array([80, 145, 155]))
        dark_ratio = cv2.countNonZero(dark_mask) / total_pixels

        # ── Signal 4: Even/normal skin ────────────────────────────────────────
        # Normal skin = mid-high L, A and B close to neutral
        normal_mask = cv2.inRange(lab, np.array([120, 125, 125]), np.array([220, 140, 150]))
        normal_ratio = cv2.countNonZero(normal_mask) / total_pixels

        logger.info(
            f"Color signals — brown={brown_ratio:.3f}, red={red_ratio:.3f}, "
            f"dark={dark_ratio:.3f}, normal={normal_ratio:.3f} | model={primary}({confidence:.2f})"
        )

        new_condition = None

        # ── Rule 1: Strong brown signal → melasma or hyperpigmentation ────────
        # Melasma: large concentrated brown patches (>25% of face)
        # Hyperpigmentation: diffuse moderate browning (12-25%)
        # Guard: brown must dominate over red (not just warm skin tone)
        if brown_ratio > 0.25 and brown_ratio > red_ratio * 3.0 and red_ratio < 0.08:
            new_condition = 'melasma'
        elif brown_ratio > 0.15 and brown_ratio > red_ratio * 2.5 and red_ratio < 0.06 and primary in ('redness', 'acne', 'normal_skin'):
            new_condition = 'hyperpigmentation'

        # ── Rule 2: Strong red signal → acne or redness ───────────────────────
        # Acne: red signal present but localised (not flooding whole face)
        # Redness: red signal is broad/diffuse (covers large area)
        elif red_ratio > 0.15 and primary in ('melasma', 'hyperpigmentation', 'dark_spots', 'normal_skin'):
            # Check if red is concentrated (acne) or spread (redness)
            # Use morphological analysis — erode to find concentrated spots
            red_binary = (red_mask > 0).astype(np.uint8)
            kernel = np.ones((5, 5), np.uint8)
            eroded = cv2.erode(red_binary, kernel, iterations=2)
            concentrated_ratio = cv2.countNonZero(eroded) / total_pixels
            
            if concentrated_ratio > 0.02:  # concentrated spots → acne
                new_condition = 'acne'
            else:  # diffuse redness → redness
                new_condition = 'redness'

        # ── Rule 3: Dark spots ────────────────────────────────────────────────
        # Dark spots = small SCATTERED dark patches on otherwise normal skin
        # Key difference from melasma: spots are isolated, not large patches
        elif dark_ratio > 0.03 and normal_ratio > 0.25:
            # Use connected components to check if dark areas are small & scattered
            dark_binary = (dark_mask > 0).astype(np.uint8)
            num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(dark_binary)
            
            # Count components that are "spot-sized" (small isolated patches)
            spot_count = 0
            large_patch_count = 0
            for i in range(1, num_labels):  # skip background (0)
                area = stats[i, cv2.CC_STAT_AREA]
                if 10 < area < 300:      # small spot
                    spot_count += 1
                elif area > 800:          # large patch (melasma territory)
                    large_patch_count += 1
            
            logger.info(f"Dark spots analysis — spots={spot_count}, large_patches={large_patch_count}")
            
            # Many small spots, few large patches = dark spots condition
            if spot_count > 8 and large_patch_count < 3:
                new_condition = 'dark_spots'

        # ── Rule 4: Very high normal signal → normal skin ─────────────────────
        elif normal_ratio > 0.60 and brown_ratio < 0.08 and red_ratio < 0.08:
            if primary not in ('normal_skin',):
                new_condition = 'normal_skin'

        # ── Apply override if we found a better condition ─────────────────────
        if new_condition and new_condition != primary:
            logger.info(f"Color override: {primary} → {new_condition}")

            if 'detected_conditions' in result and isinstance(result['detected_conditions'], dict):
                if primary in result['detected_conditions']:
                    result['detected_conditions'][primary]['detected'] = False
                if new_condition in result['detected_conditions']:
                    result['detected_conditions'][new_condition]['detected'] = True
                    result['detected_conditions'][new_condition]['confidence'] = 0.55

            result['primary_condition'] = new_condition
            result['primary_confidence'] = 0.55
            result['recommendations'] = CONDITION_RECOMMENDATIONS[new_condition]
            result['overall_health_score'] = max(30, 100 - {
                'acne': 20, 'dark_spots': 12, 'hyperpigmentation': 12,
                'melasma': 16, 'normal_skin': 0, 'redness': 12
            }.get(new_condition, 10))
            result['color_override'] = True

    except Exception as e:
        logger.warning(f"Color correction failed (non-critical): {e}")

    return result


def _transform_analyzer_response(raw_results: dict, preprocessing_metadata: Optional[dict] = None) -> dict:
    """
    Transform analyzer response to match AnalysisResult model format.
=======
def _transform_analyzer_response(raw_results: dict, preprocessing_metadata: Optional[dict] = None) -> dict:
    """
    Transform analyzer response to match AnalysisResult model format
    
    Args:
        raw_results: Raw response from analyzer.analyze_image()
        preprocessing_metadata: Optional preprocessing metadata
        
    Returns:
        Transformed results matching AnalysisResult schema
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    """
    if not raw_results.get("success", False):
        return {
            "detected_conditions": [],
            "confidence_scores": {},
            "overall_health_score": 0,
            "recommendations": [raw_results.get("error", "Analysis failed")],
            "model_confidence": 0.0,
            "preprocessing_metadata": preprocessing_metadata,
            "error": raw_results.get("error")
        }
<<<<<<< HEAD

    # Extract detected conditions as list of condition IDs
    detected_conditions = []
    confidence_scores = {}

=======
    
    # Extract detected conditions as list of condition IDs
    detected_conditions = []
    confidence_scores = {}
    
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    detected_conditions_dict = raw_results.get("detected_conditions", {})
    for condition_id, condition_data in detected_conditions_dict.items():
        if condition_data.get("detected", False):
            detected_conditions.append(condition_id)
            confidence_scores[condition_id] = condition_data.get("confidence", 0.0)
<<<<<<< HEAD

    # Extract recommendations as list of strings
=======
    
    # Extract recommendations as list of strings (titles)
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    recommendations_list = raw_results.get("recommendations", [])
    recommendations = []
    if isinstance(recommendations_list, list):
        for rec in recommendations_list:
            if isinstance(rec, dict):
                recommendations.append(rec.get("title", ""))
            elif isinstance(rec, str):
                recommendations.append(rec)
<<<<<<< HEAD

    # Calculate average model confidence
    model_confidence = 0.0
    if confidence_scores:
        model_confidence = sum(confidence_scores.values()) / len(confidence_scores)

=======
    
    # Calculate average model confidence from detected conditions
    model_confidence = 0.0
    if confidence_scores:
        model_confidence = sum(confidence_scores.values()) / len(confidence_scores)
    
    # Convert numpy types to native Python types
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    result = {
        "detected_conditions": detected_conditions,
        "confidence_scores": _convert_numpy_types(confidence_scores),
        "overall_health_score": int(raw_results.get("overall_health_score", 0)),
        "recommendations": recommendations,
        "model_confidence": float(model_confidence),
        "preprocessing_metadata": _convert_numpy_types(preprocessing_metadata) if preprocessing_metadata else None,
        "error": None
    }
<<<<<<< HEAD

    return result


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Dermora AI Skin Analysis Service",
    description="AI-powered skin analysis using EfficientNet-B2 and OpenCV preprocessing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
=======
    
    return result

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Dermora AI Skin Analysis Service",
    description="AI-powered skin analysis using Hugging Face models and OpenCV preprocessing",
    version="1.0.0"
)

# CORS configuration - Allow frontend to call directly
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8081,exp://localhost:8081").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development (restrict in production)
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


<<<<<<< HEAD
# ─────────────────────────────────────────────────────────────────────────────
# Response Models
# ─────────────────────────────────────────────────────────────────────────────

=======
# Response models
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
class AnalysisResult(BaseModel):
    detected_conditions: list[str]
    confidence_scores: dict[str, float]
    overall_health_score: int
    recommendations: list[str]
    model_confidence: float
    preprocessing_metadata: Optional[dict] = None
    error: Optional[str] = None


class HealthCheck(BaseModel):
    status: str
    model_loaded: bool
    device: str


<<<<<<< HEAD
# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthCheck)
async def root():
    """Health check endpoint."""
=======
@app.get("/", response_model=HealthCheck)
async def root():
    """Health check endpoint"""
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    analyzer = get_analyzer()
    return {
        "status": "healthy",
        "model_loaded": analyzer.model is not None,
        "device": analyzer.device
    }


<<<<<<< HEAD
@app.get("/model/info")
async def model_info():
    """Get information about the loaded model."""
    analyzer = get_analyzer()
    return {
        "model_name": analyzer.model_name,
        "device": analyzer.device,
        "model_loaded": analyzer.model is not None,
        "available_conditions": analyzer.SKIN_CONDITIONS
    }


@app.post("/analyze", response_model=AnalysisResult)
async def analyze_skin(file: UploadFile = File(...)):
    """
    Analyze skin image.

    Args:
        file: Image file (JPEG, PNG, etc.)

    Returns:
        AnalysisResult with detected conditions, confidence scores, and recommendations.
=======
@app.post("/analyze", response_model=AnalysisResult)
async def analyze_skin(file: UploadFile = File(...)):
    """
    Analyze skin image
    
    Args:
        file: Image file (JPEG, PNG, etc.)
        
    Returns:
        AnalysisResult with detected conditions, confidence scores, and recommendations
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
<<<<<<< HEAD
            raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

        # Read image data
        image_data = await file.read()

        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        logger.info(f"Processing image: {file.filename}, size: {len(image_data)} bytes")

=======
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        # Read image data
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        logger.info(f"Processing image: {file.filename}, size: {len(image_data)} bytes")
        
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
        # Preprocess image
        try:
            processed_image, preprocessing_metadata = preprocessor.preprocess_for_model(
                image_data,
                enhance=True,
                target_size=(224, 224)
            )
            logger.info(f"Preprocessing complete. Metadata: {preprocessing_metadata}")
        except Exception as e:
            logger.error(f"Preprocessing error: {e}")
<<<<<<< HEAD
            raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {str(e)}")

=======
            raise HTTPException(
                status_code=400,
                detail=f"Image preprocessing failed: {str(e)}"
            )
        
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
        # Analyze image
        try:
            analyzer = get_analyzer()
            raw_results = analyzer.analyze_image(processed_image)
<<<<<<< HEAD

            # Post-processing: correct redness→melasma/hyperpigmentation confusion
            raw_results = _apply_color_correction(processed_image, raw_results)

            logger.info(f"Analysis complete. Condition: {raw_results.get('primary_condition')} | Health score: {raw_results['overall_health_score']}")
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            analyzer = get_analyzer()
            raw_results = analyzer._get_error_response(str(e))

        # Transform and return
        results = _transform_analyzer_response(raw_results, preprocessing_metadata)
        return AnalysisResult(**results)

=======
            logger.info(f"Analysis complete. Health score: {raw_results['overall_health_score']}")
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            raw_results = analyzer._get_error_response(str(e))
        
        # Transform results to match AnalysisResult model
        results = _transform_analyzer_response(raw_results, preprocessing_metadata)
        
        return AnalysisResult(**results)
        
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/analyze-base64")
async def analyze_skin_base64(data: dict):
    """
<<<<<<< HEAD
    Analyze skin image from base64 encoded string.
    """
    try:
        import base64

        if 'image' not in data:
            raise HTTPException(status_code=400, detail="Missing 'image' field in request")

=======
    Analyze skin image from base64 encoded string
    
    Args:
        data: Dictionary with 'image' key containing base64 string
        
    Returns:
        AnalysisResult
    """
    try:
        import base64
        
        if 'image' not in data:
            raise HTTPException(status_code=400, detail="Missing 'image' field in request")
        
        # Decode base64
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
        try:
            image_data = base64.b64decode(data['image'])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64: {str(e)}")
<<<<<<< HEAD

        processed_image, preprocessing_metadata = preprocessor.preprocess_for_model(
            image_data, enhance=True, target_size=(224, 224)
        )

        analyzer = get_analyzer()
        raw_results = analyzer.analyze_image(processed_image)
        raw_results = _apply_color_correction(processed_image, raw_results)

        results = _transform_analyzer_response(raw_results, preprocessing_metadata)
        return AnalysisResult(**results)

=======
        
        # Process same as file upload
        processed_image, preprocessing_metadata = preprocessor.preprocess_for_model(
            image_data,
            enhance=True,
            target_size=(224, 224)
        )
        
        analyzer = get_analyzer()
        raw_results = analyzer.analyze_image(processed_image)
        
        # Transform results to match AnalysisResult model
        results = _transform_analyzer_response(raw_results, preprocessing_metadata)
        
        return AnalysisResult(**results)
        
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


<<<<<<< HEAD
def _load_fallback_test_image(image_path: Optional[str] = None) -> bytes:
    """Load fallback test image from file path."""
    if image_path is None:
        image_path = os.getenv("FALLBACK_IMAGE_PATH", "images.jpeg")

    if not os.path.isabs(image_path):
        if not os.path.exists(image_path):
            ai_service_dir = os.path.dirname(os.path.abspath(__file__))
            image_path = os.path.join(ai_service_dir, image_path)

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Fallback test image not found at: {image_path}")

    with open(image_path, 'rb') as f:
        image_data = f.read()

    if len(image_data) == 0:
        raise ValueError(f"Image file is empty: {image_path}")

    return image_data


@app.post("/analyze-test", response_model=AnalysisResult)
async def analyze_skin_test(
    image_path: Optional[str] = Query(None, description="Path to test image file.")
):
    """Test endpoint using a local image file."""
    try:
        image_data = _load_fallback_test_image(image_path)

        processed_image, preprocessing_metadata = preprocessor.preprocess_for_model(
            image_data, enhance=True, target_size=(224, 224)
        )

        analyzer = get_analyzer()
        raw_results = analyzer.analyze_image(processed_image)
        raw_results = _apply_color_correction(processed_image, raw_results)

        results = _transform_analyzer_response(raw_results, preprocessing_metadata)

        if results.get("preprocessing_metadata"):
            results["preprocessing_metadata"]["is_test_image"] = True

        return AnalysisResult(**results)

=======
@app.get("/model/info")
async def model_info():
    """Get information about the loaded model"""
    analyzer = get_analyzer()
    return {
        "model_name": analyzer.model_name,
        "device": analyzer.device,
        "model_loaded": analyzer.model is not None,
        "available_conditions": analyzer.SKIN_CONDITIONS
    }


def _load_fallback_test_image(image_path: Optional[str] = None) -> bytes:
    """
    Load fallback test image from file path for backend model testing
    
    Args:
        image_path: Path to test image file. If None, uses FALLBACK_IMAGE_PATH env var
                    or defaults to 'test_image.jpg' in current directory
    
    Returns:
        Image data as bytes
    
    Raises:
        FileNotFoundError: If image file doesn't exist
        ValueError: If image cannot be loaded
    """
    # Get image path from parameter, env var, or default
    if image_path is None:
        image_path = os.getenv("FALLBACK_IMAGE_PATH", "images.jpeg")
    
    # Resolve path (supports both absolute and relative paths)
    if not os.path.isabs(image_path):
        # Try relative to current directory first
        if not os.path.exists(image_path):
            # Try relative to ai-service directory
            ai_service_dir = os.path.dirname(os.path.abspath(__file__))
            image_path = os.path.join(ai_service_dir, image_path)
    
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Fallback test image not found at: {image_path}")
    
    logger.info(f"Loading fallback test image from: {image_path}")
    
    # Read image file
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        if len(image_data) == 0:
            raise ValueError(f"Image file is empty: {image_path}")
        
        logger.info(f"Loaded test image: {len(image_data)} bytes")
        return image_data
        
    except Exception as e:
        raise ValueError(f"Failed to load image from {image_path}: {str(e)}")


@app.post("/analyze-test", response_model=AnalysisResult)
async def analyze_skin_test(image_path: Optional[str] = Query(None, description="Path to test image file. If not provided, uses FALLBACK_IMAGE_PATH env var or 'test_image.jpg' in current directory")):
    """
    Test endpoint for backend model using a fallback test image
    This endpoint loads a test image from file path and analyzes it without requiring file upload
    Useful for testing the backend model independently
    
    Args:
        image_path: Optional query parameter - path to test image file. 
                   If not provided, uses FALLBACK_IMAGE_PATH environment variable 
                   or defaults to 'test_image.jpg' in current directory
    
    Example:
        POST /analyze-test?image_path=/path/to/test/image.jpg
        POST /analyze-test  (uses env var or default)
    """
    try:
        logger.info("🧪 Testing backend model with fallback image...")
        
        # Load fallback test image from file path
        image_data = _load_fallback_test_image(image_path)
        
        # Preprocess image
        try:
            processed_image, preprocessing_metadata = preprocessor.preprocess_for_model(
                image_data,
                enhance=True,
                target_size=(224, 224)
            )
            logger.info(f"Preprocessing complete. Metadata: {preprocessing_metadata}")
        except Exception as e:
            logger.error(f"Preprocessing error: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Image preprocessing failed: {str(e)}"
            )
        
        # Analyze image
        try:
            analyzer = get_analyzer()
            raw_results = analyzer.analyze_image(processed_image)
            logger.info(f"Analysis complete. Health score: {raw_results['overall_health_score']}")
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            raw_results = analyzer._get_error_response(str(e))
        
        # Transform results to match AnalysisResult model
        results = _transform_analyzer_response(raw_results, preprocessing_metadata)
        
        # Add test flag to metadata
        if results.get("preprocessing_metadata"):
            results["preprocessing_metadata"]["is_test_image"] = True
        
        return AnalysisResult(**results)
        
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# Dermatologists Nearby Endpoint
# ─────────────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
DERMATOLOGISTS_DB = [
    {
        "id": "1",
        "name": "Dr. Zafar Ahmed",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 3220,
        "address": "Skin Laser & Cosmetology Center, Garden Road, Saddar, Karachi",
        "phone": "+92 21 38140600",
        "availability": "Available Today",
        "experience": "27 years",
        "consultationFee": "Rs. 2,000",
        "services": ["Hair Problems", "Acne & Acne Scars", "Warts Removal", "Aesthetic Procedures"],
        "latitude": 24.8608,
        "longitude": 67.0104,
    },
    {
        "id": "2",
        "name": "Dr. Summaya Jamal",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 1457,
        "address": "SSJ Skin Clinic, North Nazimabad, Karachi",
        "phone": "+92 300 2345678",
        "availability": "Available Today",
        "experience": "8 years",
        "consultationFee": "Rs. 1,500",
        "services": ["PRP", "Acne", "Skin Problems", "Aesthetic Procedures"],
        "latitude": 24.9402,
        "longitude": 67.0649,
    },
    {
        "id": "3",
        "name": "Dr. Shamail Zia",
        "specialty": "Dermatologist & Aesthetic Physician",
        "rating": 4.8,
        "reviews": 458,
        "address": "South City Hospital, Clifton, Karachi",
        "phone": "+92 300 3456789",
        "availability": "Available Today",
        "experience": "13 years",
        "consultationFee": "Rs. 2,000",
        "services": ["Hair Problems", "PRP", "Laser Hair Removal", "Acne"],
        "latitude": 24.8138,
        "longitude": 67.0300,
    },
    {
        "id": "4",
        "name": "Dr. Anita Kazi",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 726,
        "address": "Doctors Plaza, The Plaza Hospital, Do Talwar, Karachi",
        "phone": "+92 300 4567890",
        "availability": "Available Today",
        "experience": "7 years",
        "consultationFee": "Rs. 3,000",
        "services": ["Hair Problems", "Acne", "Skin Problems", "Nails Treatment"],
        "latitude": 24.8074,
        "longitude": 67.0286,
    },
    {
        "id": "5",
        "name": "Dr. Ibnat Islam",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 557,
        "address": "Fatima Dental and Skin Care, Gulzar-e-Hijri Scheme 33, Karachi",
        "phone": "+92 300 5678901",
        "availability": "Available Today",
        "experience": "9 years",
        "consultationFee": "Rs. 1,000",
        "services": ["Hair Problems", "PRP", "Acne", "Acne Scars"],
        "latitude": 24.9500,
        "longitude": 67.1000,
    },
    {
        "id": "6",
        "name": "Dr. Khurram Mushir",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 553,
        "address": "Skin Vision Clinic, DHA City Karachi",
        "phone": "+92 300 6789012",
        "availability": "Available Today",
        "experience": "12 years",
        "consultationFee": "Rs. 1,800",
        "services": ["Hair Problems", "Acne", "Nails Treatment", "Skin Diseases"],
        "latitude": 24.8300,
        "longitude": 66.9800,
    },
    {
        "id": "7",
        "name": "Dr. Batool Rehman",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 574,
        "address": "Online / Video Consultation, Karachi",
        "phone": "+92 300 7890123",
        "availability": "Next Available: Tomorrow",
        "experience": "3 years",
        "consultationFee": "Rs. 500",
        "services": ["Hair Problems", "PRP", "Acne", "Acne Scars"],
        "latitude": 24.8607,
        "longitude": 67.0011,
    },
    {
        "id": "8",
        "name": "Dr. Daulat Pinjani",
        "specialty": "Dermatologist",
        "rating": 4.7,
        "reviews": 178,
        "address": "Yousuf Grand Square, Clifton, Karachi",
        "phone": "+92 300 8901234",
        "availability": "Available Today",
        "experience": "45 years",
        "consultationFee": "Rs. 2,500",
        "services": ["Acne Scars", "Hair Fall", "Skin Rejuvenation", "Stretch Marks Removal"],
        "latitude": 24.8180,
        "longitude": 67.0350,
    },
    {
        "id": "9",
        "name": "Dr. Rana Ghazanfar",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 139,
        "address": "Banaras National Hospital, Civil Lines, Karachi",
        "phone": "+92 300 9012345",
        "availability": "Available Today",
        "experience": "39 years",
        "consultationFee": "Rs. 500",
        "services": ["Warts & Mole Removal", "Fat Dissolving", "HydraFacial", "PRP"],
        "latitude": 24.8700,
        "longitude": 67.0100,
    },
    {
        "id": "10",
        "name": "Dr. Salman Mansoor",
        "specialty": "Dermatologist & Cosmetic Surgeon",
        "rating": 4.5,
        "reviews": 413,
        "address": "The Skin Hospital, DHA City Karachi",
        "phone": "+92 300 0123456",
        "availability": "Available Today",
        "experience": "21 years",
        "consultationFee": "Rs. 2,500",
        "services": ["Acne Scars", "Laser Treatment", "Warts Removal", "Skin Tightening"],
        "latitude": 24.8250,
        "longitude": 66.9750,
    },
    {
        "id": "11",
        "name": "Dr. Naeem Iqbal",
        "specialty": "Dermatologist",
        "rating": 4.7,
        "reviews": 477,
        "address": "Lifeline Hospital, North Nazimabad, Karachi",
        "phone": "+92 321 1234567",
        "availability": "Next Available: Tomorrow",
        "experience": "38 years",
        "consultationFee": "Rs. 2,200",
        "services": ["General Dermatology", "Acne", "Skin Diseases"],
        "latitude": 24.9350,
        "longitude": 67.0600,
    },
    {
        "id": "12",
        "name": "Dr. Hina Omer",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 171,
        "address": "Pasha Clinic, PECHS, Karachi",
        "phone": "+92 321 2345678",
        "availability": "Available Today",
        "experience": "10 years",
        "consultationFee": "Rs. 3,000",
        "services": ["PRP", "Acne Scars", "Melasma", "Laser Hair Removal"],
        "latitude": 24.8615,
        "longitude": 67.0641,
    },
    {
        "id": "13",
        "name": "Dr. Syed Muhammad Rizwan",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 235,
        "address": "Lifeline Hospital, North Nazimabad, Karachi",
        "phone": "+92 321 3456789",
        "availability": "Available Today",
        "experience": "19 years",
        "consultationFee": "Rs. 1,800",
        "services": ["Hair Problems", "Acne", "Acne Scars"],
        "latitude": 24.9350,
        "longitude": 67.0600,
    },
    {
        "id": "14",
        "name": "Dr. Naveed Ali Baloch",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 130,
        "address": "Naveed Derma Care Laser & Aesthetic Centre, Clifton, Karachi",
        "phone": "+92 321 4567890",
        "availability": "Available Today",
        "experience": "20 years",
        "consultationFee": "Rs. 2,000",
        "services": ["PRP", "Laser Hair Removal", "Acne Scars", "Melasma"],
        "latitude": 24.8200,
        "longitude": 67.0320,
    },
    {
        "id": "15",
        "name": "Dr. Nazia Shakeel",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 212,
        "address": "Lyfe Healthcare Hospital, Adamjee Nagar, Karachi",
        "phone": "+92 321 5678901",
        "availability": "Available Today",
        "experience": "8 years",
        "consultationFee": "Rs. 2,000",
        "services": ["Skin Problems", "Anti Aging", "Aesthetic Procedures", "Warts Removal"],
        "latitude": 24.8700,
        "longitude": 67.0650,
    },
    {
        "id": "16",
        "name": "Dr. Pervaiz Lateef",
        "specialty": "Dermatologist",
        "rating": 4.7,
        "reviews": 426,
        "address": "Skin Care & Cure, North Karachi",
        "phone": "+92 321 6789012",
        "availability": "Available Today",
        "experience": "35 years",
        "consultationFee": "Rs. 1,500",
        "services": ["Hair Problems", "Acne Scars", "Laser Treatment", "Anti Aging"],
        "latitude": 24.9800,
        "longitude": 67.0650,
    },
    {
        "id": "17",
        "name": "Dr. Warda Amin Shaikh",
        "specialty": "Dermatologist",
        "rating": 4.7,
        "reviews": 513,
        "address": "Aziza Hussaini Hospital, F.B Area, Karachi",
        "phone": "+92 321 7890123",
        "availability": "Available Today",
        "experience": "3 years",
        "consultationFee": "Rs. 500",
        "services": ["Hair Problems", "PRP", "Acne", "Acne Scars"],
        "latitude": 24.9250,
        "longitude": 67.0750,
    },
    {
        "id": "18",
        "name": "Dr. Shagufta Baig",
        "specialty": "Dermatologist & Aesthetic Physician",
        "rating": 4.8,
        "reviews": 21,
        "address": "Altamash General Hospital, Clifton, Karachi",
        "phone": "+92 321 8901234",
        "availability": "Available Today",
        "experience": "15 years",
        "consultationFee": "Rs. 3,000",
        "services": ["Hair Problems", "PRP", "Laser for Acne"],
        "latitude": 24.8150,
        "longitude": 67.0310,
    },
    {
        "id": "19",
        "name": "Dr. Zafar Ahmad",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 109,
        "address": "Taj Consultant Clinics, Gulshan-e-Iqbal Block 3, Karachi",
        "phone": "+92 321 9012345",
        "availability": "Available Today",
        "experience": "36 years",
        "consultationFee": "Rs. 3,000",
        "services": ["Hair Problems", "Acne", "Acne Scars"],
        "latitude": 24.9215,
        "longitude": 67.0991,
    },
    {
        "id": "20",
        "name": "Dr. Muniba Akmal",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 65,
        "address": "Medicenter General Hospital, PECHS, Karachi",
        "phone": "+92 322 1234567",
        "availability": "Available Today",
        "experience": "9 years",
        "consultationFee": "Rs. 1,700",
        "services": ["Laser Hair Removal", "Acne Scars", "Melasma", "Vampire Facelift"],
        "latitude": 24.8615,
        "longitude": 67.0641,
    },
    {
        "id": "21",
        "name": "Dr. Khalid Mehmood",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 191,
        "address": "Noor Clinic, North Nazimabad, Karachi",
        "phone": "+92 322 2345678",
        "availability": "Available Today",
        "experience": "21 years",
        "consultationFee": "Rs. 1,000",
        "services": ["Hair Problems", "Acne", "Skin Problems", "Hair Fall"],
        "latitude": 24.9402,
        "longitude": 67.0649,
    },
    {
        "id": "22",
        "name": "Dr. Ambreen Shakeel",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 216,
        "address": "MYM Hospital, New Karachi",
        "phone": "+92 322 3456789",
        "availability": "Available Today",
        "experience": "10 years",
        "consultationFee": "Rs. 1,000",
        "services": ["General Dermatology", "Skin Problems", "Hair Problems"],
        "latitude": 24.9900,
        "longitude": 67.0700,
    },
    {
        "id": "23",
        "name": "Dr. Sabah Faisal",
        "specialty": "Dermatologist",
        "rating": 4.9,
        "reviews": 123,
        "address": "Video Consultation, Karachi",
        "phone": "+92 322 4567890",
        "availability": "Next Available: Tomorrow",
        "experience": "5 years",
        "consultationFee": "Rs. 450",
        "services": ["Acne", "Melasma", "Pigmentation", "Eczema", "Psoriasis", "Vitiligo"],
        "latitude": 24.8607,
        "longitude": 67.0011,
    },
    {
        "id": "24",
        "name": "Dr. Syeda Asra Jamal",
        "specialty": "Dermatologist",
        "rating": 4.6,
        "reviews": 143,
        "address": "Deluxe Skin Care Clinic, Gulistan-e-Johar, Karachi",
        "phone": "+92 322 5678901",
        "availability": "Available Today",
        "experience": "15 years",
        "consultationFee": "Rs. 1,200",
        "services": ["PRP", "Laser for Acne", "Nails Treatment"],
        "latitude": 24.9271,
        "longitude": 67.1144,
    },
    {
        "id": "25",
        "name": "Dr. Farhan Mir Shaikh",
        "specialty": "Dermatologist",
        "rating": 4.8,
        "reviews": 89,
        "address": "Allure Clinics, DHA, Karachi",
        "phone": "+92 322 6789012",
        "availability": "Next Available: Tomorrow",
        "experience": "12 years",
        "consultationFee": "Rs. 1,500",
        "services": ["PRP", "Vitiligo", "Psoriasis", "Acne", "Skin Infections"],
        "latitude": 24.7971,
        "longitude": 67.0636,
=======
import math

DERMATOLOGISTS_DB = [
    {
        "id": "1",
        "name": "Dr. Ayesha Khan",
        "specialty": "Dermatologist & Cosmetologist",
        "rating": 4.8,
        "reviews": 156,
        "address": "Gulberg III, Lahore",
        "phone": "+92 300 1234567",
        "availability": "Available Today",
        "experience": "12 years",
        "consultationFee": "Rs. 2,500",
        "services": ["Acne Treatment", "Anti-Aging", "Laser Therapy", "Chemical Peels"],
        "latitude": 31.5204,
        "longitude": 74.3587,
    },
    {
        "id": "2",
        "name": "Dr. Muhammad Ali",
        "specialty": "Dermatologist",
        "rating": 4.6,
        "reviews": 89,
        "address": "DHA Phase 5, Lahore",
        "phone": "+92 301 2345678",
        "availability": "Next Available: Tomorrow",
        "experience": "8 years",
        "consultationFee": "Rs. 2,000",
        "services": ["Skin Cancer Screening", "Psoriasis Treatment", "Eczema Care"],
        "latitude": 31.4794,
        "longitude": 74.4073,
    },
    {
        "id": "3",
        "name": "Dr. Fatima Sheikh",
        "specialty": "Dermatologist & Aesthetic Medicine",
        "rating": 4.9,
        "reviews": 203,
        "address": "Johar Town, Lahore",
        "phone": "+92 302 3456789",
        "availability": "Available Today",
        "experience": "15 years",
        "consultationFee": "Rs. 3,000",
        "services": ["Botox", "Fillers", "Skin Rejuvenation", "Scar Treatment"],
        "latitude": 31.4697,
        "longitude": 74.3006,
    },
    {
        "id": "4",
        "name": "Dr. Hassan Ahmed",
        "specialty": "Pediatric Dermatologist",
        "rating": 4.7,
        "reviews": 124,
        "address": "Model Town, Lahore",
        "phone": "+92 303 4567890",
        "availability": "Next Available: 2 days",
        "experience": "10 years",
        "consultationFee": "Rs. 2,200",
        "services": ["Pediatric Skin Conditions", "Birthmark Treatment", "Allergy Testing"],
        "latitude": 31.4822,
        "longitude": 74.3248,
    },
    {
        "id": "5",
        "name": "Dr. Zara Malik",
        "specialty": "Dermatologist & Hair Specialist",
        "rating": 4.5,
        "reviews": 167,
        "address": "Cantt, Lahore",
        "phone": "+92 304 5678901",
        "availability": "Available Today",
        "experience": "9 years",
        "consultationFee": "Rs. 2,300",
        "services": ["Hair Loss Treatment", "Scalp Conditions", "Nail Disorders"],
        "latitude": 31.5497,
        "longitude": 74.3695,
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    },
]


<<<<<<< HEAD

=======
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two lat/lon points in kilometres."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
<<<<<<< HEAD
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
=======
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


class DermatologistResponse(BaseModel):
    id: str
    name: str
    specialty: str
    rating: float
    reviews: int
    distance_km: float
    address: str
    phone: str
    availability: str
    experience: str
    consultationFee: str
    services: list[str]
    latitude: float
    longitude: float


@app.get("/dermatologists/nearby", response_model=list[DermatologistResponse])
async def get_nearby_dermatologists(
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    radius_km: float = Query(50.0, description="Search radius in kilometres"),
    sort_by: str = Query("distance", description="Sort by: distance | rating"),
    available_today: bool = Query(False, description="Filter to only available-today doctors"),
):
<<<<<<< HEAD
    """Return dermatologists within radius_km of the given coordinates."""
=======
    """
    Return dermatologists within radius_km of the given coordinates,
    sorted by distance (default) or rating.
    """
>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
    results = []
    for doc in DERMATOLOGISTS_DB:
        dist = _haversine_km(lat, lon, doc["latitude"], doc["longitude"])
        if dist <= radius_km:
            if available_today and "Available Today" not in doc["availability"]:
                continue
            results.append({**doc, "distance_km": dist})

    if sort_by == "rating":
        results.sort(key=lambda d: d["rating"], reverse=True)
    else:
        results.sort(key=lambda d: d["distance_km"])

<<<<<<< HEAD
    logger.info(f"Dermatologists query: lat={lat}, lon={lon}, radius={radius_km}km → {len(results)} results")
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True, log_level="info")
=======
    logger.info(f"Nearby dermatologists query: lat={lat}, lon={lon}, radius={radius_km}km → {len(results)} results")
    return results


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

>>>>>>> 54f6c62251fec93ce5e2c879edf8b4a786094641
