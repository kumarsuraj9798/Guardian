import base64
from typing import Optional
import os

try:
  import google.generativeai as genai
except Exception:
  genai = None


def classify_image_base64(b64: str, api_key: Optional[str]) -> Optional[str]:
  if not api_key or genai is None:
    return None
  try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    image_bytes = base64.b64decode(b64.split(",",1)[1] if "," in b64 else b64)
    parts = [{"mime_type": "image/png", "data": image_bytes}]
    prompt = (
      "Analyze this emergency image and determine which service should respond. "
      "Look for: fire/smoke/burning = firebrigade, accident/injury/medical = ambulance, "
      "crime/violence/theft = police, medical emergency = hospital. "
      "Return ONLY one word: ambulance, hospital, police, firebrigade."
    )
    resp = model.generate_content([prompt, *parts])
    return (resp.text or "").strip() if hasattr(resp, "text") else None
  except Exception:
    return None