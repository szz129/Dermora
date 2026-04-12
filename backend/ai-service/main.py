"""
FastAPI Server for Skin Analysis
Provides REST API endpoints for skin image analysis
"""

import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
from dotenv import load_dotenv
import logging
import cv2
import numpy as np
import io

from image_preprocessing import preprocessor
from skin_analyzer import get_analyzer

# Load environment variables
load_dotenv()


def _convert_numpy_types(obj):
    """
    Recursively convert numpy types to native Python types for JSON serialization
    """
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


def _transform_analyzer_response(raw_results: dict, preprocessing_metadata: Optional[dict] = None) -> dict:
    """
    Transform analyzer response to match AnalysisResult model format
    
    Args:
        raw_results: Raw response from analyzer.analyze_image()
        preprocessing_metadata: Optional preprocessing metadata
        
    Returns:
        Transformed results matching AnalysisResult schema
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
    
    # Extract detected conditions as list of condition IDs
    detected_conditions = []
    confidence_scores = {}
    
    detected_conditions_dict = raw_results.get("detected_conditions", {})
    for condition_id, condition_data in detected_conditions_dict.items():
        if condition_data.get("detected", False):
            detected_conditions.append(condition_id)
            confidence_scores[condition_id] = condition_data.get("confidence", 0.0)
    
    # Extract recommendations as list of strings (titles)
    recommendations_list = raw_results.get("recommendations", [])
    recommendations = []
    if isinstance(recommendations_list, list):
        for rec in recommendations_list:
            if isinstance(rec, dict):
                recommendations.append(rec.get("title", ""))
            elif isinstance(rec, str):
                recommendations.append(rec)
    
    # Calculate average model confidence from detected conditions
    model_confidence = 0.0
    if confidence_scores:
        model_confidence = sum(confidence_scores.values()) / len(confidence_scores)
    
    # Convert numpy types to native Python types
    result = {
        "detected_conditions": detected_conditions,
        "confidence_scores": _convert_numpy_types(confidence_scores),
        "overall_health_score": int(raw_results.get("overall_health_score", 0)),
        "recommendations": recommendations,
        "model_confidence": float(model_confidence),
        "preprocessing_metadata": _convert_numpy_types(preprocessing_metadata) if preprocessing_metadata else None,
        "error": None
    }
    
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Response models
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


@app.get("/", response_model=HealthCheck)
async def root():
    """Health check endpoint"""
    analyzer = get_analyzer()
    return {
        "status": "healthy",
        "model_loaded": analyzer.model is not None,
        "device": analyzer.device
    }


@app.post("/analyze", response_model=AnalysisResult)
async def analyze_skin(file: UploadFile = File(...)):
    """
    Analyze skin image
    
    Args:
        file: Image file (JPEG, PNG, etc.)
        
    Returns:
        AnalysisResult with detected conditions, confidence scores, and recommendations
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
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
        
        return AnalysisResult(**results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/analyze-base64")
async def analyze_skin_base64(data: dict):
    """
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
        try:
            image_data = base64.b64decode(data['image'])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64: {str(e)}")
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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

