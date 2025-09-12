import base64
from typing import Optional

try:
  import google.generativeai as genai
except Exception:
  genai = None


def classify_video_base64(b64: str, api_key: Optional[str]) -> Optional[str]:
  if not api_key or genai is None:
    return None
  try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    video_bytes = base64.b64decode(b64.split(",",1)[1] if "," in b64 else b64)
    parts = [{"mime_type": "video/mp4", "data": video_bytes}]
    prompt = (
      "Classify emergency responder from this video. Return one word only: "
      "ambulance, hospital, police, firebrigade."
    )
    resp = model.generate_content([prompt, *parts])
    return (resp.text or "").strip() if hasattr(resp, "text") else None
  except Exception:
    return None