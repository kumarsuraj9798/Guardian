const express = require("express");
const SessionHistory = require("../models/SessionHistory");
const { authRequired } = require("../utils/authMiddleware");

const router = express.Router();

// Get user's session history
router.get("/history", authRequired, async (req, res) => {
  try {
    const sessionId = req.sessionID;
    const userId = req.user.userId;

    const sessionHistory = await SessionHistory.findOne({ sessionId, userId });
    
    if (!sessionHistory) {
      return res.json({
        pageVisits: [],
        incidentReports: [],
        adminActions: [],
        preferences: {},
        lastActivity: null
      });
    }

    res.json({
      pageVisits: sessionHistory.pageVisits || [],
      incidentReports: sessionHistory.incidentReports || [],
      adminActions: sessionHistory.adminActions || [],
      preferences: sessionHistory.preferences || {},
      lastActivity: sessionHistory.lastActivity
    });
  } catch (error) {
    console.error("Error fetching session history:", error);
    res.status(500).json({ message: "Failed to fetch session history" });
  }
});

// Update user preferences
router.put("/preferences", authRequired, async (req, res) => {
  try {
    const sessionId = req.sessionID;
    const userId = req.user.userId;
    const { preferences } = req.body;

    await SessionHistory.findOneAndUpdate(
      { sessionId, userId },
      { 
        $set: { 
          preferences: { ...preferences },
          lastActivity: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

// Get user's recent activity
router.get("/activity", authRequired, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const recentActivity = await SessionHistory.aggregate([
      { $match: { userId: userId } },
      { $unwind: "$pageVisits" },
      { $sort: { "pageVisits.timestamp": -1 } },
      { $limit: limit },
      { $project: {
        page: "$pageVisits.page",
        timestamp: "$pageVisits.timestamp",
        duration: "$pageVisits.duration"
      }}
    ]);

    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

// Clear session history
router.delete("/clear", authRequired, async (req, res) => {
  try {
    const sessionId = req.sessionID;
    const userId = req.user.userId;

    await SessionHistory.findOneAndUpdate(
      { sessionId, userId },
      {
        $set: {
          pageVisits: [],
          incidentReports: [],
          adminActions: [],
          lastActivity: new Date()
        }
      }
    );

    res.json({ message: "Session history cleared successfully" });
  } catch (error) {
    console.error("Error clearing session history:", error);
    res.status(500).json({ message: "Failed to clear session history" });
  }
});

// Get session statistics
router.get("/stats", authRequired, async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await SessionHistory.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalPageVisits: { $sum: { $size: "$pageVisits" } },
          totalIncidentReports: { $sum: { $size: "$incidentReports" } },
          totalAdminActions: { $sum: { $size: "$adminActions" } },
          lastActivity: { $max: "$lastActivity" },
          activeSessions: { $sum: { $cond: ["$isActive", 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      totalPageVisits: 0,
      totalIncidentReports: 0,
      totalAdminActions: 0,
      lastActivity: null,
      activeSessions: 0
    });
  } catch (error) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ message: "Failed to fetch session statistics" });
  }
});

module.exports = router;
