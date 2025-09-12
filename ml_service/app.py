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
    if api_key and genai is not None:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = (
                "Decide the emergency responder service for this report. "
                "Return ONLY one word from: ambulance, hospital, police, firebrigade.\n\n"
                f"Report text: {report.text}"
            )
            resp = model.generate_content(prompt)
            text = resp.text.strip() if hasattr(resp, "text") else "ambulance"
            label = normalize_service_label(text)
            # refine using modalities if provided
            if report.image:
                im = classify_image_base64(report.image, api_key)
                if im:
                    label = normalize_service_label(im)
            if report.audio and not report.image:
                au = classify_audio_base64(report.audio, api_key)
                if au:
                    label = normalize_service_label(au)
            if report.video and not report.image and not report.audio:
                vi = classify_video_base64(report.video, api_key)
                if vi:
                    label = normalize_service_label(vi)
            return {"service": label.capitalize()}
        except Exception:
            pass
    # Fallback simple decision
    service = decide_service(text=report.text)
    return {"service": service.capitalize()}