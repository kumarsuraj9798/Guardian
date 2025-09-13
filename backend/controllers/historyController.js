const History = require("../models/History");
const Incident = require("../models/Incident");
const ServiceUnit = require("../models/ServiceUnit");

async function myHistory(req, res) {
  try {
    const items = await History.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate({ path: "incidentId", select: "status createdAt assignedUnitId classifiedService location" });
    return res.json({ history: items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch history" });
  }
}

async function getIncidentHistory(req, res) {
  try {
    const incidents = await Incident.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate({ 
        path: "assignedUnitId", 
        select: "name type isActive location",
        model: ServiceUnit 
      })
      .select("description status createdAt classifiedService location assignedUnitId");
    
    return res.json(incidents);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch incident history" });
  }
}

module.exports = { myHistory, getIncidentHistory };