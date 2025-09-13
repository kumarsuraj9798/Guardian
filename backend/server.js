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
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
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
    secure: false, // Set to true in production with HTTPS
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

io.on("connection", (socket) => {
  socket.on("join-incident", (incidentId) => {
    socket.join(`incident:${incidentId}`);
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