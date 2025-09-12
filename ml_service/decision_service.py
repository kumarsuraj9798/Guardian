from typing import Optional


def decide_service(text: Optional[str] = None, image_label: Optional[str] = None, audio_label: Optional[str] = None) -> str:
  s = (text or "").lower()
  if any(k in s for k in ["fire", "smoke", "burn"]):
    return "firebrigade"
  if any(k in s for k in ["attack", "theft", "police", "robbery"]):
    return "police"
  if any(k in s for k in ["accident", "injury", "ambulance", "medical"]):
    return "ambulance"
  # simple fallbacks from other modalities
  if image_label in ["fire", "smoke"]:
    return "firebrigade"
  if audio_label in ["scream", "gunshot"]:
    return "police"
  return "ambulance"