import base64
from typing import Optional


def decode_video_base64(b64: str | None) -> Optional[bytes]:
  if not b64:
    return None
  try:
    payload = b64.split(",", 1)[1] if "," in b64 else b64
    return base64.b64decode(payload)
  except Exception:
    return None


def extract_preview_frame(_: bytes) -> Optional[bytes]:
  # Placeholder: integrate cv2/ffmpeg to extract a representative frame
  # Returning None keeps pipeline optional for video → image conversion
  return None


