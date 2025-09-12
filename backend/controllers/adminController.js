const ServiceUnit = require("../models/ServiceUnit");

async function upsertUnit(req, res) {
  try {
    const { id, name, type, location, isActive } = req.body;
    if (!name || !type || !location) return res.status(400).json({ message: "Missing fields" });
    let unit;
    if (id) {
      unit = await ServiceUnit.findByIdAndUpdate(
        id,
        { name, type, location, isActive, adminOwnerId: req.user.userId },
        { new: true }
      );
    } else {
      unit = await ServiceUnit.create({ name, type, location, isActive, adminOwnerId: req.user.userId });
    }
    return res.json({ unit });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to upsert unit" });
  }
}

async function listMyUnits(req, res) {
  try {
    const units = await ServiceUnit.find({ adminOwnerId: req.user.userId }).sort({ createdAt: -1 });
    return res.json({ units });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch units" });
  }
}

async function toggleUnitActive(req, res) {
  try {
    const { id, isActive } = req.body;
    const unit = await ServiceUnit.findOneAndUpdate(
      { _id: id, adminOwnerId: req.user.userId },
      { isActive },
      { new: true }
    );
    return res.json({ unit });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to toggle" });
  }
}

module.exports = { upsertUnit, listMyUnits, toggleUnitActive };