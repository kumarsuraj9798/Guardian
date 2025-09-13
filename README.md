# GuardianNet 🚨  
**AI-powered Emergency Dispatch System**

![License](https://img.shields.io/badge/license-MIT-green)  
![Build](https://img.shields.io/badge/build-passing-brightgreen)  
![MongoDB](https://img.shields.io/badge/Database-MongoDB-blue)  
![Node.js](https://img.shields.io/badge/Backend-Node.js-yellow)  
![React](https://img.shields.io/badge/Frontend-React-blue)  
![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-orange)  

GuardianNet is a smart **Emergency AI Response System** designed to quickly connect people in crisis with the nearest responders such as **Ambulance, Police, Fire, and Hospitals**.  
It leverages **AI decision-making, real-time tracking, and an intuitive dashboard** to improve emergency response times and save lives.  


GuardianNet is a smart **Emergency AI Response System** designed to quickly connect people in crisis with the nearest responders such as **Ambulance, Police, Fire, and Hospitals**.  
It leverages **AI decision-making, real-time tracking, and an intuitive dashboard** to improve emergency response times and save lives.  

---

## 🚀 Features  
- 🌐 Modern Web Interface (React/Next.js or similar)  
- 🤖 AI-based incident prioritization and classification  
- 🏥 Connects users to **Ambulance, Police, Fire, Hospitals**  
- 📍 Location-based emergency dispatching  
- 📊 Admin Dashboard for monitoring incidents  
- 📝 History of past incidents for tracking & reporting  
- 🔐 Secure authentication for users & responders  

---

## 🏗️ Architecture  
1. **Frontend (React/Next.js)**  
   - Landing page with quick emergency buttons  
   - User login and role-based access (User, Admin, Responder)  
   - Real-time incident reporting & active incidents display  

2. **Backend (Node.js/Express)**  
   - API endpoints for handling incidents  
   - AI/ML model for classification & prioritization  
   - Authentication & authorization  

3. **Database (MongoDB Atlas / Compass)**  
   - Stores users, responders, incident logs, and response history  

4. **AI Integration**  
   - Categorizes incidents (Medical, Fire, Accident, Police)  
   - Suggests nearest responders based on location & availability  

---

## 🔄 Flow of Working  
1. User signs in and reports an **incident** (Accident, Fire, Medical, Crime).  
2. System uses **AI classification** to determine urgency & best responders.  
3. Request is dispatched to **nearest available units** (Ambulance, Police, Fire).  
4. **Admin Dashboard** shows live incidents & status (en route, resolved).  
5. User & responders can track status in real time.  
6. Incident is stored in **history logs** for future reference.  

---

## 📸 Screenshots  
# Landing Page  
![Landing Page Demo](docs/screenshots/landing.png)  

# Active Incidents  
![Incidents Dashboard](docs/screenshots/incidents.png)  

---

# ⚙️ Installation & Setup  

# 1️⃣ Clone the repository  
bash
git clone https://github.com/your-username/GuardianNet.git
cd GuardianNet

# Install frontend dependencies
cd client

# ⚙️ Installation & Setup  
---
## 2️⃣ Install dependencies  
bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install

npm install

# Install backend dependencies
cd ../server
npm install

# 3️⃣ Configure environment variables

**Create a .env file in the backend (server/) with:**

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
---

# 4️⃣ Run the project
**Start backend
cd server
npm start

**Start frontend
cd ../client
npm start

---
# App will run at:

**Frontend**
→ http://localhost:3000

**Backend**
→ http://localhost:5000

---

# 🛠️ Tech Stack
---
**Frontend:** 
React.js / Next.js, TailwindCSS

**Backend:**
Node.js, Express.js

**Database:**
MongoDB (Compass/Atlas)

**AI/ML:**
Python/Node ML libraries (for classification)

**Auth:** 
JWT-based authentication
---

# 📌 Roadmap
---
✅ Basic emergency reporting system


✅ User/Admin authentication


🔄 Real-time location-based dispatch


🔄 AI-powered resource allocation


🔄 Mobile App Integration


🤝 Contributing


Contributions are welcome! Please fork this repo and submit a pull request.

📄 License

**This project is licensed under the MIT License.**

👨‍💻 Authors

**Suraj Kumar – GitHub**



