#!/usr/bin/env python3
"""
Test client for the GuardianNet AI Triage Service
"""
import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_health():
    """Test the health endpoint"""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Could not connect to service: {e}")
        return False

def test_analyze_text():
    """Test the analyze endpoint with text input"""
    print("\n🔍 Testing analyze endpoint with text...")
    
    test_cases = [
        "There was a car crash, someone is bleeding",
        "My chest hurts and I can't breathe", 
        "I see smoke coming from my neighbor's house",
        "Someone broke into my home and stole my belongings"
    ]
    
    for i, text in enumerate(test_cases, 1):
        print(f"\n📝 Test case {i}: '{text}'")
        try:
            data = {"text_input": text}
            response = requests.post(f"{BASE_URL}/analyze", data=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Analysis successful!")
                print(f"   Services: {result.get('services_required', [])}")
                print(f"   Reasoning: {result.get('reasoning', 'N/A')}")
            else:
                print(f"❌ Analysis failed with status {response.status_code}")
                print(f"   Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")

def test_analyze_no_input():
    """Test the analyze endpoint with no input (should fail)"""
    print("\n🚫 Testing analyze endpoint with no input...")
    try:
        response = requests.post(f"{BASE_URL}/analyze", data={}, timeout=5)
        if response.status_code == 400:
            result = response.json()
            print("✅ Correctly rejected empty request!")
            print(f"   Error message: {result.get('error')}")
        else:
            print(f"❌ Expected 400 error, got {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

def main():
    print("🧪 GuardianNet AI Triage Service Test Client")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("\n❌ Service not available. Make sure it's running on port 8001")
        return
    
    # Wait a moment for service to be fully ready
    time.sleep(1)
    
    # Test text analysis
    test_analyze_text()
    
    # Test error handling
    test_analyze_no_input()
    
    print("\n" + "=" * 50)
    print("🎉 Testing complete!")
    print("\nNote: For full AI analysis functionality, make sure:")
    print("1. Your GEMINI_API_KEY is set correctly")
    print("2. You have internet connection for Gemini API access")

if __name__ == "__main__":
    main()