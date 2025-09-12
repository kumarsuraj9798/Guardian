from typing import Optional

def normalize_service_label(text: str) -> str:
  t = (text or "").lower()
  if "fire" in t or "brigade" in t:
    return "firebrigade"
  if "police" in t or "law" in t:
    return "police"
  if "hospital" in t or "doctor" in t:
    return "hospital"
  if "ambulance" in t or "medical" in t or "injury" in t:
    return "ambulance"
  return "ambulance"

# NLP model for text