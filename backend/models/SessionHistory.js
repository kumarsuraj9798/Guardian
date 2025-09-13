const mongoose = require("mongoose");

const SessionHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, enum: ["citizen", "admin"], required: true },
    
    // Navigation history
    pageVisits: [{
      page: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      duration: { type: Number, default: 0 } // in seconds
    }],
    
    // Incident reports history
    incidentReports: [{
      incidentId: { type: String, required: true },
      type: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      status: { type: String, enum: ["pending", "assigned", "in_progress", "resolved"], default: "pending" }
    }],
    
    // Admin actions history
    adminActions: [{
      action: { type: String, required: true },
      targetId: { type: String },
      timestamp: { type: Date, default: Date.now },
      details: { type: mongoose.Schema.Types.Mixed }
    }],
    
    // User preferences
    preferences: {
      theme: { type: String, default: "light" },
      notifications: { type: Boolean, default: true },
      language: { type: String, default: "en" }
    },
    
    // Session metadata
    lastActivity: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for efficient queries
SessionHistorySchema.index({ sessionId: 1, userId: 1 });
SessionHistorySchema.index({ lastActivity: -1 });
SessionHistorySchema.index({ "incidentReports.timestamp": -1 });

module.exports = mongoose.model("SessionHistory", SessionHistorySchema);
