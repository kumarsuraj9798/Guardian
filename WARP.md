# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

GuardianNet is an AI-powered Emergency Dispatch System that connects people in crisis with emergency responders (Ambulance, Police, Fire, Hospital). The system uses multi-modal AI to classify incidents based on text, images, audio, and video inputs.

## Development Commands

### Backend (Node.js/Express)
```powershell
# Install dependencies
npm install

# Start backend server
npm start
# Server runs on http://localhost:5000

# Environment setup required:
# - MONGO_URI (default: mongodb://127.0.0.1:27017/guardiannet)
# - SESSION_SECRET (default: guardiannet_secret_key_2024)
# - PORT (default: 5000)
```

### Frontend (React)
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# Frontend runs on http://localhost:3000

# Build for production
npm run build

# Run tests
npm test
```

### ML Service (FastAPI/Python)
```powershell
# Install Python dependencies
pip install -r requirements.txt

# Start ML service
uvicorn ml_service.app:app --host 0.0.0.0 --port 8000
# ML service runs on http://localhost:8000

# Test ML service
python test_ml.py

# Environment setup required:
# - GEMINI_API_KEY for Google Generative AI (optional, has fallback)
```

### Full System Startup (All Services)
```powershell
# Terminal 1: Start Backend
npm start

# Terminal 2: Start Frontend
cd frontend && npm start

# Terminal 3: Start ML Service
uvicorn ml_service.app:app --host 0.0.0.0 --port 8000
```

## Architecture Overview

### Core Components

**Frontend (React)**: Single-page application with role-based access
- **CitizenPortal**: Emergency reporting interface with media upload
- **AdminDashboard**: Real-time incident monitoring and management
- **IncidentMap**: Geographic visualization of active incidents
- **AnalyticsDashboard**: Historical incident analysis

**Backend (Node.js/Express)**: RESTful API with WebSocket support
- **Routes**: `/api/auth`, `/api/report`, `/api/admin`, `/api/history`, `/api/session`
- **Models**: User, Incident, ServiceUnit, History, SessionHistory
- **Middleware**: Authentication, session tracking, CORS handling

**ML Service (FastAPI)**: Multi-modal incident classification
- **Primary**: Google Gemini API for text/image/video/audio analysis
- **Fallback**: Rule-based keyword classification system
- **Services**: Separate modules for text, image, audio, and video processing

### Data Flow

1. **Incident Reporting**: User submits incident via CitizenPortal with optional media
2. **ML Classification**: Backend calls ML service (`/classify`) with incident data
3. **Service Assignment**: ML service returns classified emergency service type
4. **Real-time Updates**: WebSocket broadcasts incident updates to AdminDashboard
5. **Geographic Indexing**: MongoDB 2dsphere index enables location-based queries

### Database Schema (MongoDB)

**Incident Collection**:
- Multi-media support (text, image, video, audio)
- GeoJSON Point locations with 2dsphere indexing
- Status tracking: reported → dispatched → enroute → resolved
- Service classification: ambulance, hospital, police, firebrigade

**Session Tracking**: Comprehensive user interaction logging with MongoDB session store

### Authentication & Sessions

- **Express-session** with MongoDB store (7-day cookie lifetime)
- **Role-based access**: citizen vs admin dashboards
- **Session middleware**: Tracks page visits, incident reports, admin actions

### Key Integration Points

**ML Service Integration** (`backend/utils/callMLService.js`):
- Formats incident data for ML service consumption
- Handles media type extraction from incident.media array
- 10-second timeout with fallback to "Ambulance" classification

**WebSocket Communication**:
- Real-time incident updates via Socket.io
- Room-based messaging for specific incidents (`incident:${incidentId}`)

**Media Handling**:
- Base64 encoding for image/audio/video in database
- Unified MediaSchema with type and content fields

## Development Notes

- **Multi-modal AI**: System processes text descriptions, images, audio recordings, and video simultaneously for more accurate emergency classification
- **Fallback Strategy**: If Gemini API fails, rule-based keyword matching ensures system reliability
- **Geographic Indexing**: All incidents are geo-indexed for efficient location-based queries and mapping
- **Session Persistence**: MongoDB session store maintains user state across browser sessions
- **Real-time Architecture**: WebSocket integration enables live dashboard updates for emergency response coordination

## Testing ML Service

Use `test_ml.py` to verify ML service functionality with various input types. The ML service prioritizes media analysis (image → video → audio → text) for classification accuracy.