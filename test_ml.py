#!/usr/bin/env python3
import requests
import json

def test_ml_service():
    url = "http://localhost:8000/classify"
    
    # Test cases
    test_cases = [
        {"text": "house on fire", "image": None},
        {"text": "car accident", "image": None},
        {"text": "robbery in progress", "image": None},
        {"text": "", "image": "fake-image-data"},  # Image only
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            response = requests.post(url, json=test_case, timeout=5)
            if response.status_code == 200:
                result = response.json()
                print(f"Test {i}: {test_case} -> {result}")
            else:
                print(f"Test {i}: Error {response.status_code}")
        except Exception as e:
            print(f"Test {i}: Exception - {e}")

if __name__ == "__main__":
    test_ml_service()
