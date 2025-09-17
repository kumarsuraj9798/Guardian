#!/usr/bin/env python3
import requests
import json
import time

def test_ml_service():
    base_url = "http://localhost:8000"
    
    # First check if service is running
    try:
        health_response = requests.get(f"{base_url}/health", timeout=3)
        print(f"Health check: {health_response.status_code} - {health_response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return
    
    # Test cases for emergency classification
    test_cases = [
        {"text": "house on fire, smoke everywhere", "description": "Fire emergency"},
        {"text": "car accident on highway, injuries reported", "description": "Ambulance needed"},
        {"text": "robbery in progress, armed suspect", "description": "Police emergency"},
        {"text": "heart attack, patient unconscious", "description": "Hospital emergency"},
        {"text": "broken leg after fall", "description": "Medical emergency"},
        {"text": "", "image": "fake-image-data", "description": "Image only"},
        {"text": None, "description": "No text provided"},
    ]
    
    print("\nTesting emergency classification:")
    classify_url = f"{base_url}/classify"
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            response = requests.post(classify_url, json=test_case, timeout=10)
            if response.status_code == 200:
                result = response.json()
                description = test_case.get('description', 'Test case')
                text = test_case.get('text', 'No text')
                print(f"Test {i} ({description}): '{text}' -> {result['service']}")
            else:
                print(f"Test {i}: HTTP Error {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Test {i}: Exception - {e}")
        
        # Small delay between requests
        time.sleep(0.5)
    
    print("\nML Service testing completed!")

if __name__ == "__main__":
    test_ml_service()
