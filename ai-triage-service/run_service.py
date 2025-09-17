#!/usr/bin/env python3
"""
Simple script to run the GuardianNet AI Triage Service
"""
import os
import uvicorn
from main import app

if __name__ == "__main__":
    # Set a demo API key if not provided
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️  Warning: GEMINI_API_KEY not set. Set your API key for full functionality.")
        print("   Get your API key from: https://aistudio.google.com/app/apikey")
        print("   Set it with: $env:GEMINI_API_KEY='your_key_here'")
        print("")
    
    print("🚀 Starting GuardianNet AI Triage Microservice...")
    print("📍 Service will be available at: http://localhost:8001")
    print("💚 Health check: http://localhost:8001/health")
    print("🔍 API docs: http://localhost:8001/docs")
    print("⏹️  Press Ctrl+C to stop")
    print("")
    
    try:
        uvicorn.run(
            app, 
            host="127.0.0.1", 
            port=8001,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Service stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting service: {e}")
        print("\nMake sure port 8001 is available and try again.")