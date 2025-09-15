import base64
from typing import Optional

try:
  import google.generativeai as genai
except Exception:
  genai = None


def classify_audio_base64(b64: str, api_key: Optional[str]) -> Optional[list]:
    """
    Classify emergency responders from audio input.
    Returns a list of emergency unit types mentioned in the audio.
    Possible return values: ['ambulance', 'hospital', 'police', 'firebrigade']
    """
    if not api_key or genai is None:
        return None
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        audio_bytes = base64.b64decode(b64.split(",", 1)[1] if "," in b64 else b64)
        
        parts = [{"mime_type": "audio/webm", "data": audio_bytes}]
        
        prompt = """
        Analyze this emergency call audio and identify all emergency services mentioned or implied.
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
        
        Only include services that are clearly mentioned or strongly implied by the context.
        """
        
        response = model.generate_content([prompt, *parts])
        
        if not hasattr(response, 'text') or not response.text:
            return None
            
        # Try to parse the response as JSON
        try:
            import json
            services = json.loads(response.text.strip())
            if isinstance(services, list) and all(isinstance(s, str) for s in services):
                # Validate service types
                valid_services = []
                valid_types = {'ambulance', 'hospital', 'police', 'firebrigade'}
                for service in services:
                    if service.lower() in valid_types:
                        valid_services.append(service.lower())
                return valid_services if valid_services else ['police']  # Default to police if no valid services found
        except json.JSONDecodeError:
            # Fallback to text parsing if JSON parsing fails
            text = response.text.lower()
            services = []
            if any(word in text for word in ['ambulance', 'medical', 'paramedic', 'injured', 'hurt', 'accident']):
                services.append('ambulance')
            if any(word in text for word in ['hospital', 'clinic', 'medical center', 'emergency room', 'er']):
                services.append('hospital')
            if any(word in text for word in ['police', 'cop', 'officer', 'crime', 'robbery', 'theft', 'violence']):
                services.append('police')
            if any(word in text for word in ['fire', 'firebrigade', 'fire brigade', 'blaze', 'burning', 'explosion']):
                services.append('firebrigade')
            return services if services else ['police']  # Default to police if no services identified
            
    except Exception as e:
        print(f"Error in audio classification: {str(e)}")
        return ['police']  # Default to police in case of any error