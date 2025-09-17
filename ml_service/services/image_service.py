import base64
from typing import Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None


def classify_image_base64(b64: str, api_key: Optional[str]) -> Optional[str]:
    """
    Classify emergency image using Google Generative AI to determine appropriate service.
    
    Args:
        b64 (str): Base64 encoded image string (may include data URI prefix)
        api_key (Optional[str]): Google Generative AI API key
        
    Returns:
        Optional[str]: Emergency service name (ambulance, hospital, police, firebrigade) or None on failure
    """
    # Return None if API key is missing or genai module is not available
    if api_key is None or genai is None:
        return None
    
    try:
        # Configure the API
        genai.configure(api_key=api_key)
        
        # Handle data URI prefix if present
        if b64.startswith("data:image/"):
            # Extract base64 data after the comma
            b64 = b64.split(",", 1)[1]
        
        # Decode the base64 string
        image_data = base64.b64decode(b64)
        
        # Create the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare the image data for the API
        image_part = {
            "mime_type": "image/png",
            "data": image_data
        }
        
        # Define the prompt
        prompt = "Analyze this emergency image and determine which service should respond. Look for: fire/smoke/burning = firebrigade, accident/injury/medical = ambulance, crime/violence/theft = police, medical emergency = hospital. Return ONLY one word: ambulance, hospital, police, firebrigade."
        
        # Generate content
        response = model.generate_content([prompt, image_part])
        
        # Extract and clean the response text
        if response.text:
            result = response.text.strip().lower()
            # Validate against allowed services
            if result in ["ambulance", "hospital", "police", "firebrigade"]:
                return result
        
        return None
        
    except Exception:
        return None
