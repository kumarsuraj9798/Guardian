from fastapi import FastAPI
from pydantic import BaseModel
from utils.config import settings
from decision_service import decide_service
from services.text_service import normalize_service_label
from services.image_service import classify_image_base64
from services.audio_service import classify_audio_base64
from services.video_service import classify_video_base64
import os
try:
    import google.generativeai as genai
except Exception:
    genai = None

app = FastAPI()

class Report(BaseModel):
    text: str | None = None
    audio: str | None = None  # base64
    image: str | None = None  # base64
    video: str | None = None  # base64

@app.post("/classify")
def classify(report: Report):
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    
    print(f"Received report: text={bool(report.text)}, image={bool(report.image)}, video={bool(report.video)}, audio={bool(report.audio)}")
    
    # Try Gemini API first if available
    if api_key and genai is not None:
        try:
            genai.configure(api_key=api_key)
            label = None
            
            # 1. Image analysis (highest priority)
            if report.image:
                im = classify_image_base64(report.image, api_key)
                if im:
                    label = normalize_service_label(im)
                    print(f"Image classification result: {im} -> {label}")
            
            # 2. Video analysis (if no image)
            if not label and report.video:
                vi = classify_video_base64(report.video, api_key)
                if vi:
                    label = normalize_service_label(vi)
                    print(f"Video classification result: {vi} -> {label}")
            
            # 3. Audio analysis (if no image/video)
            if not label and report.audio:
                au = classify_audio_base64(report.audio, api_key)
                if au:
                    label = normalize_service_label(au)
                    print(f"Audio classification result: {au} -> {label}")
            
            # 4. Text analysis (if no media or as fallback)
            if not label and report.text:
                model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = (
                    "Decide the emergency responder service for this report. "
                    "Return ONLY one word from: ambulance, hospital, police, firebrigade.\n\n"
                    f"Report text: {report.text}"
                )
                resp = model.generate_content(prompt)
                text = resp.text.strip() if hasattr(resp, "text") else ""
                if text:
                    label = normalize_service_label(text)
                    print(f"Text classification result: {text} -> {label}")
            
            if label:
                return {"service": label.capitalize()}
        except Exception as e:
            print(f"Gemini API error: {e}")
    
    # Enhanced fallback system
    print("Using enhanced fallback system...")
    service = decide_service(text=report.text, has_image=bool(report.image))
    print(f"Fallback result: {service}")
    return {"service": service.capitalize()}