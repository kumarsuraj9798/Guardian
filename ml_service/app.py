from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import os
from typing import Optional

app = FastAPI(title="GuardianNet ML Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Report(BaseModel):
    text: Optional[str] = None
    audio: Optional[str] = None  # base64
    image: Optional[str] = None  # base64
    video: Optional[str] = None  # base64

def classify_text_emergency(text: str) -> str:
    """Enhanced rule-based emergency classification using keyword analysis"""
    if not text:
        return "ambulance"
    
    text_lower = text.lower()
    
    # Fire emergency keywords (highest priority)
    fire_keywords = [
        'fire', 'smoke', 'burning', 'flames', 'blaze', 'explosion', 
        'house fire', 'building fire', 'forest fire', 'wildfire',
        'gas leak', 'chemical spill'
    ]
    if any(keyword in text_lower for keyword in fire_keywords):
        return "firebrigade"
    
    # Police emergency keywords
    police_keywords = [
        'robbery', 'theft', 'burglary', 'break in', 'breaking and entering',
        'assault', 'violence', 'fight', 'domestic violence', 'abuse',
        'shooting', 'stabbing', 'weapon', 'gun', 'knife',
        'crime', 'criminal', 'suspect', 'vandalism', 'harassment',
        'kidnapping', 'missing person', 'suspicious activity'
    ]
    if any(keyword in text_lower for keyword in police_keywords):
        return "police"
    
    # Medical/Hospital emergency keywords (severe cases)
    hospital_keywords = [
        'heart attack', 'cardiac arrest', 'stroke', 'seizure',
        'unconscious', 'not breathing', 'overdose', 'poisoning',
        'severe bleeding', 'major injury', 'critical condition',
        'emergency surgery', 'life threatening'
    ]
    if any(keyword in text_lower for keyword in hospital_keywords):
        return "hospital"
    
    # Ambulance keywords (general medical)
    ambulance_keywords = [
        'accident', 'injury', 'hurt', 'pain', 'bleeding',
        'broken bone', 'fracture', 'fall', 'car accident',
        'medical emergency', 'sick', 'nausea', 'vomiting',
        'ambulance', 'paramedic', 'first aid'
    ]
    if any(keyword in text_lower for keyword in ambulance_keywords):
        return "ambulance"
    
    # Default to ambulance for general emergencies
    return "ambulance"

def classify_media_content(has_image: bool = False, has_video: bool = False, has_audio: bool = False) -> str:
    """Simple media-based classification with fallback logic"""
    
    # If there's visual media, assume it might be fire/accident related
    if has_image or has_video:
        # Simple heuristic: visual media often indicates fire or accident
        return "firebrigade"  # Could be fire, which is visually evident
    
    # Audio might indicate distress calls
    if has_audio:
        return "ambulance"  # Audio distress calls often medical
    
    return "ambulance"

@app.get("/")
def root():
    return {"message": "GuardianNet ML Service is running", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ml-classification"}

@app.post("/classify")
def classify_emergency(report: Report):
    """Classify emergency report and return appropriate service"""
    try:
        print(f"Received report: text={bool(report.text)}, image={bool(report.image)}, video={bool(report.video)}, audio={bool(report.audio)}")
        
        # Primary classification based on text
        if report.text and report.text.strip():
            service = classify_text_emergency(report.text)
            print(f"Text classification result: {service}")
        else:
            # Fallback to media-based classification
            service = classify_media_content(
                has_image=bool(report.image),
                has_video=bool(report.video),
                has_audio=bool(report.audio)
            )
            print(f"Media-based classification result: {service}")
        
        return {"service": service.capitalize()}
        
    except Exception as e:
        print(f"Classification error: {e}")
        # Always return a safe default
        return {"service": "Ambulance"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
