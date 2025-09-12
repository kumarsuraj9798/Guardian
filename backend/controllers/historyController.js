const History = require("../models/History");
const Incident = require("../models/Incident");

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

module.exports = { myHistory };