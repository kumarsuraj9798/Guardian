const mongoose = require("mongoose");

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/guardiannet";
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB || "guardiannet",
  });
  // Basic connection logs
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));
}

module.exports = connectToDatabase;