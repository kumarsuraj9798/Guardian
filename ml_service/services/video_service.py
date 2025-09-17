import base64
from typing import Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None


def classify_video_base64(b64: str, api_key: Optional[str]) -> Optional[str]:
    """
    Classify emergency video using Google Generative AI to determine appropriate service.
    
    Args:
        b64 (str): Base64 encoded video string (may include data URI prefix)
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
        if b64.startswith("data:video/"):
            # Extract base64 data after the comma
            b64 = b64.split(",", 1)[1]
        
        # Decode the base64 string
        video_data = base64.b64decode(b64)
        
        # Create the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare the video data for the API
        video_part = {
            "mime_type": "video/mp4",
            "data": video_data
        }
        
        # Define the prompt
        prompt = "Classify emergency responder from this video. Return one word only: ambulance, hospital, police, firebrigade."
        
        # Generate content
        response = model.generate_content([prompt, video_part])
        
        # Extract and clean the response text
        if response.text:
            result = response.text.strip().lower()
            # Validate against allowed services
            if result in ["ambulance", "hospital", "police", "firebrigade"]:
                return result
        
        return None
        
    except Exception:
        return None
