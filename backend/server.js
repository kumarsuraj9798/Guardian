const express = require("express");
const http = require("http");
const cors = require("cors");
const connectToDatabase = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

app.set("io", io);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/report");
const adminRoutes = require("./routes/admin");
const historyRoutes = require("./routes/history");

app.use("/api/auth", authRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/history", historyRoutes);

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