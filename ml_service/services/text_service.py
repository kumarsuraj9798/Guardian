# NLP model for text

def normalize_service_label(text: str) -> str:
    """
    Normalize service label based on keyword matching in the input text.
    
    Args:
        text (str): Input text to analyze for emergency service keywords
        
    Returns:
        str: Emergency service name (firebrigade, police, hospital, or ambulance)
    """
    # Convert to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Check for fire-related keywords
    if "fire" in text_lower or "brigade" in text_lower:
        return "firebrigade"
    
    # Check for police-related keywords
    if "police" in text_lower or "law" in text_lower:
        return "police"
    
    # Check for hospital-related keywords
    if "hospital" in text_lower or "doctor" in text_lower:
        return "hospital"
    
    # Check for ambulance-related keywords
    if "ambulance" in text_lower or "medical" in text_lower or "injury" in text_lower:
        return "ambulance"
    
    # Default case
    return "ambulance"
