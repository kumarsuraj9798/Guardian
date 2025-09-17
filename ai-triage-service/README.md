# GuardianNet AI Triage Microservice

An intelligent emergency service triage microservice that analyzes multimodal inputs (text, audio, images) using Google's Gemini AI to determine the appropriate emergency services needed.

## Overview

This microservice is part of the GuardianNet project and serves as an AI-powered dispatcher that can:
- Analyze text descriptions of emergencies
- Process emergency scene images
- Handle audio recordings (basic support)
- Return structured recommendations for Police, Medical, and/or Fire services

## Features

- **Multimodal Analysis**: Supports text, image, and audio input simultaneously
- **High Performance**: Built with FastAPI for fast, asynchronous processing
- **Production Ready**: Includes proper logging, error handling, and health checks
- **Containerized**: Docker-ready with optimized image size and security
- **Structured Output**: Returns consistent JSON responses with service recommendations and reasoning

## Prerequisites

- Docker (recommended) OR Python 3.11+
- Google Gemini API Key

## Quick Start with Docker

### 1. Set up Environment Variable

Create a `.env` file in the project directory:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Build the Docker Image

```bash
docker build -t guardiannet-ai-triage .
```

### 3. Run the Container

```bash
docker run -d \
  --name ai-triage-service \
  --env-file .env \
  -p 8000:8000 \
  guardiannet-ai-triage
```

### 4. Test the Service

Check health:
```bash
curl http://localhost:8000/health
```

Test analysis endpoint:
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "text_input=There was a car crash, someone is bleeding"
```

## Manual Setup (Without Docker)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variable

```bash
# Windows (PowerShell)
$env:GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Linux/Mac
export GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 3. Run the Service

```bash
python main.py
```

The service will be available at `http://localhost:8000`

## API Documentation

### Endpoints

#### Health Check
- **URL**: `GET /health`
- **Response**: `{"status": "healthy", "service": "GuardianNet AI Triage Microservice"}`

#### Emergency Analysis
- **URL**: `POST /analyze`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `text_input` (optional): String description of the emergency
  - `audio_file` (optional): Audio file (.mp3, .wav, .m4a)
  - `image_file` (optional): Image file (.jpg, .png, .jpeg)

### Example Requests

#### Text Only
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "text_input=My chest hurts and I can't breathe"
```

#### Text + Image
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "text_input=There's a fire in my building" \
  -F "image_file=@emergency_scene.jpg"
```

#### Image Only
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "image_file=@car_accident.png"
```

### Response Format

#### Success Response (HTTP 200)
```json
{
  "services_required": ["Police", "Medical"],
  "reasoning": "A car crash requires police for traffic control and medical services for potential injuries."
}
```

#### Error Response (HTTP 400/500)
```json
{
  "error": "No input data provided."
}
```

### Service Types

The API can recommend the following emergency services:
- `"Police"`: Law enforcement, traffic control, crime scenes
- `"Medical"`: Ambulance, paramedics, health emergencies  
- `"Fire"`: Fire department, hazmat, rescue operations

## Configuration

### Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key

### API Key Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Set the `GEMINI_API_KEY` environment variable

## Production Deployment

### Docker Compose Example

```yaml
version: '3.8'
services:
  ai-triage-service:
    build: .
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-triage-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-triage-service
  template:
    metadata:
      labels:
        app: ai-triage-service
    spec:
      containers:
      - name: ai-triage-service
        image: guardiannet-ai-triage:latest
        ports:
        - containerPort: 8000
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secret
              key: api-key
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Testing

### Unit Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when test files are added)
pytest tests/
```

### Load Testing
```bash
# Using Apache Bench
ab -n 100 -c 10 -p test_data.json -T application/json http://localhost:8000/analyze
```

## Monitoring and Logging

The service includes:
- Structured logging with configurable levels
- Health check endpoint for monitoring
- Custom exception handlers
- Request/response logging

Logs are written to stdout and can be collected by Docker/Kubernetes logging systems.

## Security Considerations

- The service runs as a non-root user in the container
- Input validation for all file uploads
- Proper error handling without exposing internal details
- Environment-based configuration for sensitive data

## Limitations and Notes

- Audio processing is currently basic - files are accepted but primary analysis focuses on text and images
- Maximum file upload sizes are determined by FastAPI defaults
- The service requires an active internet connection to access the Gemini API
- Rate limiting should be implemented at the infrastructure level

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the logs: `docker logs ai-triage-service`
2. Verify the API key is correctly set
3. Test the health endpoint first
4. Review the API documentation above

## License

This project is part of the GuardianNet system. Please refer to the main project for licensing information.