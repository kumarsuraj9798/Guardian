#!/usr/bin/env python3
"""
Test Guardian compatibility endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_classify_compatibility():
    """Test the /classify endpoint with Guardian's expected format"""
    print("🧪 Testing Guardian Compatibility Endpoint")
    print("=" * 50)
    
    # Test cases matching Guardian's expected input format
    test_cases = [
        {
            "name": "Car Accident",
            "data": {
                "text": "There was a car crash, someone is bleeding",
                "image": None,
                "audio": None,
                "video": None
            }
        },
        {
            "name": "Medical Emergency", 
            "data": {
                "text": "My chest hurts and I can't breathe",
                "image": None,
                "audio": None,
                "video": None
            }
        },
        {
            "name": "Fire Emergency",
            "data": {
                "text": "I see smoke coming from my neighbor's house",
                "image": None,
                "audio": None,
                "video": None
            }
        },
        {
            "name": "Crime Report",
            "data": {
                "text": "Someone broke into my home and stole my belongings",
                "image": None,
                "audio": None,
                "video": None
            }
        },
        {
            "name": "Empty Input (Should fallback)",
            "data": {
                "text": None,
                "image": None,
                "audio": None,
                "video": None
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: {test_case['name']}")
        print(f"   Input: {test_case['data']['text'] or 'No text input'}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/classify",
                json=test_case['data'],
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                service = result.get('service', 'Unknown')
                print(f"   ✅ Result: {service}")
                
                # Validate Guardian expected format
                valid_services = ['Ambulance', 'Hospital', 'Police', 'Firebrigade']
                if service in valid_services:
                    print(f"   ✅ Valid Guardian service type")
                else:
                    print(f"   ❌ Invalid service type: {service}")
                    
            else:
                print(f"   ❌ HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Compatibility test complete!")

if __name__ == "__main__":
    # Check if service is running first
    try:
        health_check = requests.get(f"{BASE_URL}/health", timeout=5)
        if health_check.status_code == 200:
            print("✅ AI Triage Service is running")
            test_classify_compatibility()
        else:
            print("❌ Service not healthy")
    except:
        print("❌ AI Triage Service not running. Start it first with:")
        print("   python run_service.py")