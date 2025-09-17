# GuardianNet 🚨  
**AI-powered Emergency Dispatch System with Advanced Multimodal AI Triage**

![License](https://img.shields.io/badge/license-MIT-green)  
![Build](https://img.shields.io/badge/build-passing-brightgreen)  
![MongoDB](https://img.shields.io/badge/Database-MongoDB-blue)  
![Node.js](https://img.shields.io/badge/Backend-Node.js-yellow)  
![React](https://img.shields.io/badge/Frontend-React-blue)  
![Python](https://img.shields.io/badge/AI%20Service-Python%20FastAPI-green)  
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-orange)  

GuardianNet is a smart **Emergency AI Response System** designed to quickly connect people in crisis with the nearest responders such as **Ambulance, Police, Fire, and Hospitals**.  
It leverages **Google Gemini AI for multimodal analysis, real-time tracking, and an intuitive dashboard** to improve emergency response times and save lives.

---

## 🚀 Features  
- 🌐 **Modern Web Interface** (React frontend)  
- 🤖 **AI-powered Multimodal Analysis** (Text, Images, Audio) using Google Gemini
- 🏥 **Smart Service Dispatch** to Ambulance, Police, Fire, Hospitals  
- 📍 **Location-based Emergency Dispatching**  
- 📊 **Admin Dashboard** for monitoring incidents  
- 📝 **Complete History Tracking** for incidents & responses  
- 🔐 **Secure Authentication** for users & responders  
- ⚡ **Real-time Updates** via WebSockets
- 🎯 **Intelligent Service Classification** based on emergency context

---

## 🏗️ Architecture  

### **1. Frontend (React)**  
   - Emergency reporting interface with multimodal input
   - User authentication and role-based access  
   - Real-time incident tracking & status updates

### **2. Backend (Node.js/Express)**  
   - RESTful API for incident management
   - Authentication & authorization middleware
   - Integration with AI Triage Service
   - WebSocket support for real-time updates

### **3. AI Triage Service (Python/FastAPI)**  
   - **Google Gemini AI integration** for intelligent analysis
   - **Multimodal processing** (text, images, audio)
   - **Smart service classification** (Police/Medical/Fire)
   - **Reasoning-based decisions** with explanations

### **4. Database (MongoDB)**  
   - User profiles & authentication data
   - Incident logs with full history
   - Service unit management & tracking
   - Historical analytics & reporting

---

## 🔄 Enhanced Workflow  

1. **User Reports Emergency**: Submit text description, images, or audio recordings
2. **AI Analysis**: Gemini AI analyzes all inputs to understand the situation
3. **Smart Classification**: System determines required services (Police/Medical/Fire/Hospital)
4. **Intelligent Dispatch**: Finds and assigns nearest available service units
5. **Real-time Tracking**: All parties receive live updates on incident status
6. **Resolution & Analytics**: Incident completion with data for future improvements

---

## ⚙️ Quick Start

### **🚀 Option 1: Automated Setup (Recommended)**
```powershell
# Clone the repository
git clone https://github.com/your-username/GuardianNet.git
cd GuardianNet

# Run the complete system
./dev-start.ps1
```

### **🛠️ Option 2: Manual Setup**

#### **1️⃣ Setup AI Triage Service**
```powershell
cd ai-triage-service

# Install Python dependencies
pip install -r requirements.txt

# Configure your Gemini API key
# Get key from: https://aistudio.google.com/app/apikey
$env:GEMINI_API_KEY = "your_gemini_api_key_here"

# Start the AI service
python run_service.py
```

#### **2️⃣ Setup Backend**
```powershell
cd backend

# Install Node.js dependencies
npm install

# Configure environment (copy and edit .env.example)
cp .env.example .env

# Start backend server
npm start
```

#### **3️⃣ Setup Frontend**
```powershell
cd frontend

# Install React dependencies
npm install

# Start development server
npm start
```

---

## 📍 Service URLs

- **🤖 AI Triage Service**: http://localhost:8001
  - Health Check: `/health`
  - API Documentation: `/docs`
  - Analysis Endpoint: `/analyze` (multimodal)
  - Compatibility: `/classify` (Guardian backend)

- **🏗️ Backend API**: http://localhost:3000
  - Health Check: `/api/health`
  - Authentication: `/api/auth/*`
  - Incidents: `/api/report/*`

- **🖥️ Frontend**: http://localhost:3001
  - Main Application Interface

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React.js, TailwindCSS | User interface & experience |
| **Backend** | Node.js, Express.js | API server & business logic |
| **AI Service** | Python, FastAPI, Google Gemini | Intelligent emergency analysis |
| **Database** | MongoDB | Data persistence & history |
| **Auth** | JWT | Secure authentication |
| **Real-time** | WebSockets | Live updates |

---

## 🤖 AI Capabilities

### **Multimodal Analysis**
- **Text Processing**: Natural language understanding of emergency descriptions
- **Image Analysis**: Visual assessment of emergency scenes
- **Audio Processing**: Voice recognition and context analysis (basic support)

### **Smart Decision Making**
- **Service Classification**: Determines if Police, Medical, Fire, or Hospital response needed
- **Severity Assessment**: Evaluates urgency and resource requirements
- **Reasoning**: Provides explanations for AI decisions

### **Example Scenarios**
```json
Input: "Car accident with injuries, person unconscious"
Output: {
  "services_required": ["Police", "Medical"],
  "reasoning": "Vehicle accident requires police for traffic control and medical services for unconscious person"
}
```

---

## 📊 Configuration

### **Required Environment Variables**

#### AI Triage Service (`.env`)
```bash
GEMINI_API_KEY=your_google_gemini_api_key
```

#### Backend (`.env`)
```bash
DATABASE_URL=mongodb://localhost:27017/guardian
JWT_SECRET=your_jwt_secret_key
ML_SERVICE_URL=http://localhost:8001
PORT=3000
```

---

## 🧪 Testing

### **Test AI Service**
```powershell
cd ai-triage-service
python test_client.py
```

### **Test Complete Integration**
```powershell
# Start all services first, then:
# Use the frontend to create test incidents
# Monitor AI analysis in service logs
```

---

## 🔧 Development

### **Adding New Emergency Types**
1. Update AI service prompts in `main.py`
2. Add service mappings in backend `callMLService.js`
3. Update frontend incident categories

### **Extending AI Capabilities**
1. Modify Gemini prompts for better analysis
2. Add new input modalities (video processing)
3. Enhance service classification logic

---

## 📌 Roadmap

- ✅ **Basic Emergency Reporting System**
- ✅ **AI-Powered Multimodal Analysis** 
- ✅ **Google Gemini Integration**
- ✅ **Smart Service Classification**
- 🔄 **Enhanced Mobile Support**
- 🔄 **Advanced Analytics Dashboard**
- 🔄 **Multi-language Support**
- 🔄 **Voice-First Interface**
- 🔄 **Predictive Resource Allocation**

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🆘 Troubleshooting

### **Common Issues**

**AI Service Not Responding**
- Check if GEMINI_API_KEY is set correctly
- Verify internet connection for API access
- Check if port 8001 is available

**Backend Connection Errors**
- Ensure MongoDB is running
- Check if port 3000 is available
- Verify ML_SERVICE_URL points to AI service

**Frontend Build Issues**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall
- Check Node.js version compatibility

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**Suraj Kumar** – [GitHub](https://github.com/kumarsuraj9798)

---

## 🙏 Acknowledgments

- **Google Gemini AI** for advanced multimodal analysis capabilities
- **FastAPI** for the high-performance AI service framework
- **MongoDB** for reliable data persistence
- **React** for the modern frontend experience