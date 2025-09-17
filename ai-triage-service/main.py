import os
import json
import logging
from typing import Optional, List
from io import BytesIO
import base64

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import google.generativeai as genai
from PIL import Image
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GuardianNet AI Triage Microservice",
    description="Intelligent emergency service triage using multimodal AI analysis",
    version="1.0.0"
)

# Pydantic models for response validation
class TriageResponse(BaseModel):
    services_required: List[str]
    reasoning: str

class ErrorResponse(BaseModel):
    error: str

# Guardian compatibility models
class Report(BaseModel):
    text: Optional[str] = None
    audio: Optional[str] = None  # base64-encoded audio (optional)
    image: Optional[str] = None  # base64-encoded image (optional)
    video: Optional[str] = None  # base64-encoded video (ignored for now)

# Initialize Gemini API
def initialize_gemini():
    """Initialize the Gemini API client with API key from environment variable."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY environment variable not set")
        raise ValueError("GEMINI_API_KEY environment variable must be set")
    
    genai.configure(api_key=api_key)
    # Allow model selection via environment variable
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")
    logger.info(f"Using Gemini model: {model_name}")
    return genai.GenerativeModel(model_name)

# System prompt for Gemini
SYSTEM_PROMPT = """You are a highly intelligent AI emergency dispatcher. Your task is to analyze the user's input, which may include text, an image of the scene, and/or an audio recording of the situation. Based on all available information, determine the necessary emergency services.

Your response MUST be a single, valid JSON object and nothing else.

The JSON object must contain two keys:

'services': An array of strings. The only possible values for the strings in the array are "Police", "Medical", or "Fire". Include all services that apply.

'reasoning': A brief, one-sentence explanation for your decision.

Examples:

User provides text: 'There was a car crash, someone is hurt.' -> You respond: {"services": ["Police", "Medical"], "reasoning": "A car crash requires police for traffic control and medical services for potential injuries."}

User provides text: 'My chest hurts and I can't breathe.' -> You respond: {"services": ["Medical"], "reasoning": "The symptoms described indicate a severe medical emergency."}

User provides an image of a burning building. -> You respond: {"services": ["Fire"], "reasoning": "The image clearly shows a structure fire, requiring the fire department."}

Analyze the provided input and respond with the appropriate JSON object."""

async def process_with_gemini(model, text_input: Optional[str], image_file: Optional[UploadFile], audio_file: Optional[UploadFile]):
    """Process the multimodal inputs with Gemini API."""
    
    # Prepare the content for Gemini
    content_parts = [SYSTEM_PROMPT]
    
    # Add text input if provided
    if text_input and text_input.strip():
        content_parts.append(f"\nUser text input: {text_input}")
    
    # Process image if provided
    if image_file:
        try:
            image_bytes = await image_file.read()
            # Convert to PIL Image for processing
            image = Image.open(BytesIO(image_bytes))
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            content_parts.append("\nUser provided an image of the emergency scene.")
            # Add image to content
            content_parts.append(image)
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
    
    # Process audio if provided
    if audio_file:
        try:
            audio_bytes = await audio_file.read()
            content_parts.append("\nUser provided an audio recording of the emergency situation.")
            # Note: For audio processing, we would need to convert to appropriate format
            # For now, we'll indicate audio was provided but Gemini will work with text/image
            content_parts.append("Audio file provided but text and image analysis will be prioritized.")
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error processing audio: {str(e)}")
    
    # If no input provided
    if not any([text_input and text_input.strip(), image_file, audio_file]):
        raise HTTPException(status_code=400, detail="No input data provided.")
    
    try:
        # Generate response from Gemini
        response = model.generate_content(content_parts)
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Empty response from Gemini API")
        
        # Parse the JSON response
        response_text = response.text.strip()
        logger.info(f"Gemini response: {response_text}")
        
        # Try to parse as JSON
        try:
            parsed_response = json.loads(response_text)
        except json.JSONDecodeError:
            # If direct parsing fails, try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group())
            else:
                raise ValueError("Could not extract valid JSON from response")
        
        # Validate the response structure
        if "services" not in parsed_response or "reasoning" not in parsed_response:
            raise ValueError("Response missing required fields 'services' or 'reasoning'")
        
        services = parsed_response["services"]
        if not isinstance(services, list):
            raise ValueError("Services field must be a list")
        
        # Validate service types
        valid_services = {"Police", "Medical", "Fire"}
        for service in services:
            if service not in valid_services:
                raise ValueError(f"Invalid service type: {service}")
        
        return {
            "services_required": services,
            "reasoning": parsed_response["reasoning"]
        }
        
    except Exception as e:
        logger.error(f"Error processing with Gemini: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    try:
        global gemini_model
        gemini_model = initialize_gemini()
        logger.info("Gemini API initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API: {str(e)}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "GuardianNet AI Triage Microservice"}

# ---------- Guardian compatibility layer ----------
SEVERE_HOSPITAL_KEYWORDS = [
    'heart attack', 'cardiac arrest', 'stroke', 'seizure',
    'unconscious', 'not breathing', 'overdose', 'poisoning',
    'severe bleeding', 'major injury', 'critical condition',
    'emergency surgery', 'life threatening'
]

def choose_guardian_service(services: List[str], text_input: Optional[str]) -> str:
    """Map Gemini services to Guardian's single service label.
    Guardian expects one of: 'Ambulance', 'Hospital', 'Police', 'Firebrigade'.
    """
    # Priority: Fire > Police > Medical
    if 'Fire' in services:
        return 'Firebrigade'
    if 'Police' in services:
        return 'Police'
    # Medical: decide Hospital vs Ambulance using heuristics on text
    if 'Medical' in services:
        text = (text_input or '').lower()
        for kw in SEVERE_HOSPITAL_KEYWORDS:
            if kw in text:
                return 'Hospital'
        return 'Ambulance'
    # Default fallback
    return 'Ambulance'

@app.post("/classify")
async def classify_compat(report: Report):
    """Compatibility endpoint for Guardian backend expecting JSON input.
    Accepts the same schema as the previous ml_service and returns {"service": <OneOf>}
    """
    # Prepare optional image from base64
    image_obj: Optional[Image.Image] = None
    if report.image:
        try:
            img_bytes = base64.b64decode(report.image)
            image_obj = Image.open(BytesIO(img_bytes))
        except Exception as e:
            logger.warning(f"Failed to decode base64 image: {e}")
            image_obj = None

    # We do not process audio/video content here beyond signalling presence
    # Build Gemini content parts
    content_parts: List = [SYSTEM_PROMPT]
    if report.text and report.text.strip():
        content_parts.append(f"\nUser text input: {report.text}")
    if image_obj:
        content_parts.append("\nUser provided an image of the emergency scene.")
        content_parts.append(image_obj)
    if report.audio:
        content_parts.append("\nUser provided an audio recording of the emergency situation.")

    if len(content_parts) == 1:  # Only system prompt present
        return {"service": "Ambulance"}

    try:
        response = gemini_model.generate_content(content_parts)
        if not response or not response.text:
            logger.error("Empty response from Gemini in /classify")
            return {"service": "Ambulance"}

        # Parse response as JSON
        response_text = response.text.strip()
        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError:
            import re
            m = re.search(r'\{.*\}', response_text, re.DOTALL)
            parsed = json.loads(m.group()) if m else {"services": ["Medical"], "reasoning": "Fallback"}

        services = parsed.get('services', [])
        if not isinstance(services, list):
            services = [str(services)]

        # Map to Guardian single service
        guardian_service = choose_guardian_service(services, report.text)
        logger.info(f"/classify mapped services {services} -> {guardian_service}")
        return {"service": guardian_service}
    except Exception as e:
        logger.error(f"/classify processing error: {e}")
        return {"service": "Ambulance"}

@app.post("/analyze", response_model=TriageResponse)
async def analyze_emergency(
    text_input: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None)
):
    """
    Analyze emergency situation using multimodal AI.
    
    Args:
        text_input: Optional text description of the emergency
        audio_file: Optional audio file (mp3, wav, m4a)
        image_file: Optional image file (jpg, png, jpeg)
    
    Returns:
        JSON response with required services and reasoning
    """
    try:
        logger.info(f"Received analyze request - Text: {'Yes' if text_input else 'No'}, "
                   f"Audio: {'Yes' if audio_file else 'No'}, "
                   f"Image: {'Yes' if image_file else 'No'}")
        
        # Validate file types if provided
        if audio_file:
            if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
                raise HTTPException(status_code=400, detail="Invalid audio file format")
        
        if image_file:
            if not image_file.content_type or not image_file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="Invalid image file format")
        
        # Process with Gemini
        result = await process_with_gemini(gemini_model, text_input, image_file, audio_file)
        
        logger.info(f"Analysis complete - Services: {result['services_required']}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom exception handler for HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Custom exception handler for general exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)