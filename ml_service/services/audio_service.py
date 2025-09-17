import base64
import json
from typing import Optional, List

try:
    import google.generativeai as genai
except ImportError:
    genai = None


def classify_audio_base64(b64: str, api_key: Optional[str]) -> Optional[List[str]]:
    """
    Classify emergency audio using Google Generative AI to determine applicable services.
    
    This function analyzes emergency call audio to identify all emergency services
    mentioned or implied in the content. It attempts to parse a JSON response from
    the AI model, with fallback to keyword searching if JSON parsing fails.
    
    Args:
        b64 (str): Base64 encoded audio string (may include data URI prefix)
        api_key (Optional[str]): Google Generative AI API key
        
    Returns:
        Optional[List[str]]: List of emergency service names (ambulance, hospital, police, firebrigade)
                           or ['police'] as default, or None if API key/module unavailable
    """
    # Return None if API key is missing or genai module is not available
    if api_key is None or genai is None:
        return None
    
    # Define allowed services for validation
    allowed_services = ["ambulance", "hospital", "police", "firebrigade"]
    
    try:
        # Configure the API
        genai.configure(api_key=api_key)
        
        # Handle data URI prefix if present
        if b64.startswith("data:audio/"):
            # Extract base64 data after the comma
            b64 = b64.split(",", 1)[1]
        
        # Decode the base64 string
        audio_data = base64.b64decode(b64)
        
        # Create the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare the audio data for the API
        audio_part = {
            "mime_type": "audio/webm",
            "data": audio_data
        }
        
        # Define the detailed prompt
        prompt = """Analyze this emergency call audio and identify all emergency services mentioned or implied.
Consider the following categories:
- ambulance: for medical emergencies, injuries, accidents with injuries
- hospital: when hospital transport or medical facility is specifically mentioned
- police: for crimes, violence, theft, or law enforcement needed
- firebrigade: for fires, explosions, gas leaks, or rescue operations

Return a JSON array of all applicable services, even if multiple are mentioned.
Example outputs:
- ["ambulance"]
- ["police"]
- ["firebrigade", "ambulance"]
- ["police", "ambulance"]
- ["firebrigade", "police", "ambulance"]

Only include services that are clearly mentioned or strongly implied by the context."""
        
        # Generate content
        response = model.generate_content([prompt, audio_part])
        
        if response.text:
            response_text = response.text.strip()
            
            # Try to parse as JSON first
            try:
                services = json.loads(response_text)
                if isinstance(services, list):
                    # Validate and filter services
                    valid_services = [service.lower() for service in services 
                                    if isinstance(service, str) and service.lower() in allowed_services]
                    if valid_services:
                        return valid_services
            except json.JSONDecodeError:
                # Fallback to keyword searching
                pass
            
            # Fallback keyword search on raw text
            found_services = []
            response_lower = response_text.lower()
            
            for service in allowed_services:
                if service in response_lower:
                    found_services.append(service)
            
            # Also check for common variations
            if "fire" in response_lower or "brigade" in response_lower:
                if "firebrigade" not in found_services:
                    found_services.append("firebrigade")
            
            if "medical" in response_lower or "injury" in response_lower:
                if "ambulance" not in found_services:
                    found_services.append("ambulance")
            
            if "doctor" in response_lower:
                if "hospital" not in found_services:
                    found_services.append("hospital")
            
            if "law" in response_lower or "crime" in response_lower:
                if "police" not in found_services:
                    found_services.append("police")
            
            if found_services:
                return found_services
        
        # Default case
        return ['police']
        
    except Exception:
        # Default case on any error
        return ['police']
