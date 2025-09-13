from typing import Optional


def decide_service(text: Optional[str] = None, image_label: Optional[str] = None, audio_label: Optional[str] = None, has_image: bool = False) -> str:
  s = (text or "").lower()
  
  # Fire-related keywords (highest priority)
  if any(k in s for k in ["fire", "smoke", "burn", "burning", "flame", "flames", "blaze", "house fire", "building fire", "fire emergency"]):
    return "firebrigade"
  
  # Police-related keywords
  if any(k in s for k in ["attack", "theft", "police", "robbery", "crime", "violence", "assault", "break-in", "burglary"]):
    return "police"
  
  # Medical/ambulance keywords
  if any(k in s for k in ["accident", "injury", "ambulance", "medical", "hurt", "wounded", "emergency", "hospital", "doctor"]):
    return "ambulance"
  
  # Image label analysis
  if image_label:
    image_lower = image_label.lower()
    if any(k in image_lower for k in ["fire", "smoke", "burn", "flame", "blaze"]):
      return "firebrigade"
    if any(k in image_lower for k in ["accident", "injury", "medical", "ambulance"]):
      return "ambulance"
    if any(k in image_lower for k in ["crime", "police", "theft", "violence"]):
      return "police"
  
  # Audio label analysis
  if audio_label:
    audio_lower = audio_label.lower()
    if any(k in audio_lower for k in ["scream", "gunshot", "alarm", "siren"]):
      return "police"
    if any(k in audio_lower for k in ["crying", "help", "emergency"]):
      return "ambulance"
  
  # If we have an image but no text, assume it might be a fire (common emergency)
  if has_image and not text:
    return "firebrigade"
  
  # Default fallback
  return "ambulance"