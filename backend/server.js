const express = require("express");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const connectToDatabase = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

app.set("io", io);

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://frontend-9ywyx5oko-suraj-kumars-projects-bcd2fc14.vercel.app"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "guardiannet_secret_key_2024",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/guardiannet",
    dbName: process.env.MONGO_DB || "guardiannet",
    collectionName: "sessions"
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Import session middleware
const { trackSession, trackIncidentReport, trackAdminAction } = require("./utils/sessionMiddleware");

// Apply session tracking middleware
app.use(trackSession);

// Routes
const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/report");
const adminRoutes = require("./routes/admin");
const historyRoutes = require("./routes/history");
const sessionRoutes = require("./routes/session");

app.use("/api/auth", authRoutes);
app.use("/api/report", trackIncidentReport, reportRoutes);
app.use("/api/admin", trackAdminAction, adminRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/session", sessionRoutes);

app.get("/", (req, res) => res.send("GuardianNet Backend Running"));

// Track connected units and their locations
const connectedUnits = new Map();

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // Handle joining an incident room
  socket.on("join-incident", (incidentId) => {
    socket.join(`incident:${incidentId}`);
    console.log(`Socket ${socket.id} joined incident: ${incidentId}`);
  });
  
  // Handle unit location updates
  socket.on('unit-location-update', (data) => {
    try {
      const { unitId, incidentId, location } = data;
      if (!unitId || !incidentId || !location) {
        console.error('Invalid location update data:', data);
        return;
      }
      
      // Store the latest location
      connectedUnits.set(unitId, {
        ...location,
        lastUpdated: new Date(),
        socketId: socket.id
      });
      
      // Broadcast to everyone in the incident room
      io.to(`incident:${incidentId}`).emit('unit-location-update', {
        unitId,
        incidentId,
        unitLocation: location
      });
      
      console.log(`Location updated for unit ${unitId} in incident ${incidentId}`);
    } catch (error) {
      console.error('Error updating unit location:', error);
    }
  });
  
  // Handle unit location requests
  socket.on('request-unit-location', (data) => {
    try {
      const { incidentId, unitId } = data;
      if (!incidentId || !unitId) {
        console.error('Invalid location request data:', data);
        return;
      }
      
      const unitData = connectedUnits.get(unitId);
      if (unitData) {
        // Send the latest location to the requester
        socket.emit('unit-location-update', {
          unitId,
          incidentId,
          unitLocation: unitData
        });
      }
    } catch (error) {
      console.error('Error handling location request:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Clean up disconnected units
    for (const [unitId, data] of connectedUnits.entries()) {
      if (data.socketId === socket.id) {
        connectedUnits.delete(unitId);
        console.log(`Removed disconnected unit: ${unitId}`);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
// Basic 404 handler for API clarity
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Not Found', path: req.path });
  }
  next();
});

connectToDatabase()
  .then(() => {
    server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });

// Export for Vercel
module.exports = app;
