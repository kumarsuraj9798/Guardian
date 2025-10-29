const SessionHistory = require("../models/SessionHistory");
const jwt = require("jsonwebtoken");

// Middleware to track user sessions and history
const trackSession = async (req, res, next) => {
  try {
    const sessionId = req.sessionID;
    let userId = null;
    let userEmail = null;
    let userRole = null;

    // Get user info from JWT token if available
    const token = req.headers.authorization?.replace("Bearer ", "") || req.session.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
        userId = decoded.userId;
        userRole = decoded.role;
      } catch (err) {
        // Token invalid, continue without user info
      }
    }

    // Get user info from session if available
    if (req.session.user) {
      userId = req.session.user._id;
      userEmail = req.session.user.email;
      userRole = req.session.user.role;
    }

    // Track page visit
    if (req.method === "GET" && req.path !== "/api/health") {
      const pageVisit = {
        page: req.path,
        timestamp: new Date(),
        duration: 0 // Will be updated when user leaves the page
      };

      if (userId) {
        await SessionHistory.findOneAndUpdate(
          { sessionId, userId },
          {
            $push: { pageVisits: pageVisit },
            $set: { 
              lastActivity: new Date(),
              userEmail: userEmail || req.session.user?.email,
              userRole: userRole || req.session.user?.role,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get("User-Agent"),
              isActive: true
            }
          },
          { upsert: true, new: true }
        );
      }
    }

    // Store user info in session for future requests
    if (userId && !req.session.user) {
      req.session.user = {
        _id: userId,
        email: userEmail,
        role: userRole
      };
    }

    next();
  } catch (error) {
    console.error("Session tracking error:", error);
    next(); // Continue even if session tracking fails
  }
};

// Middleware to track incident reports
const trackIncidentReport = async (req, res, next) => {
  try {
    const sessionId = req.sessionID;
    const userId = req.user?.userId || req.session.user?._id;
    
    if (userId && req.body) {
      const incidentReport = {
        incidentId: req.body.incidentId || `inc_${Date.now()}`,
        type: req.body.type || "unknown",
        timestamp: new Date(),
        status: "pending"
      };

      await SessionHistory.findOneAndUpdate(
        { sessionId, userId },
        {
          $push: { incidentReports: incidentReport },
          $set: { lastActivity: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    next();
  } catch (error) {
    console.error("Incident tracking error:", error);
    next();
  }
};

// Middleware to track admin actions
const trackAdminAction = async (req, res, next) => {
  try {
    const sessionId = req.sessionID;
    const userId = req.user?.userId || req.session.user?._id;
    
    if (userId && req.user?.role === "admin") {
      const adminAction = {
        action: req.method + " " + req.path,
        targetId: req.params.id || req.body.id,
        timestamp: new Date(),
        details: {
          body: req.body,
          params: req.params,
          query: req.query
        }
      };

      await SessionHistory.findOneAndUpdate(
        { sessionId, userId },
        {
          $push: { adminActions: adminAction },
          $set: { lastActivity: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    next();
  } catch (error) {
    console.error("Admin action tracking error:", error);
    next();
  }
};

module.exports = {
  trackSession,
  trackIncidentReport,
  trackAdminAction
};
