const Incident = require("../models/Incident");
const ServiceUnit = require("../models/ServiceUnit");
const History = require("../models/History");
const classifyIncident = require("../utils/callMLService");

function distanceMeters([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function report(req, res) {
  try {
    const { description, media, location } = req.body;
    if (!location || !Array.isArray(location.coordinates)) {
      return res.status(400).json({ message: "Location required" });
    }

    const incident = await Incident.create({
      reporterId: req.user.userId,
      description,
      media: media || [],
      location,
      status: "reported",
    });

    // Classify via ML service
    let service = "ambulance"; // default fallback
    try {
      const mlRes = await classifyIncident({ description, media });
      if (mlRes && mlRes.service) {
        service = mlRes.service.toLowerCase();
      }
    } catch (error) {
      console.log("ML service failed, using default service:", error.message);
    }
    
    // Only set classifiedService if we have a valid service
    if (service && ["ambulance", "hospital", "police", "firebrigade"].includes(service)) {
      incident.classifiedService = service;
    }

    // Find nearest active unit of that type
    const allUnits = await ServiceUnit.find({ type: service, isActive: true, assignedIncidentId: null });
    let nearest = null;
    let nearestDist = Infinity;
    for (const unit of allUnits) {
      const dist = distanceMeters(
        incident.location.coordinates,
        unit.location.coordinates
      );
      if (dist < nearestDist) {
        nearest = unit;
        nearestDist = dist;
      }
    }

    if (nearest) {
      incident.assignedUnitId = nearest._id;
      incident.status = "dispatched";
      nearest.assignedIncidentId = incident._id;
      await nearest.save();
    }

    await incident.save();
    await History.create({ userId: req.user.userId, incidentId: incident._id, status: incident.status });

    // Notify via websockets
    const io = req.app.get("io");
    io.to(`incident:${incident._id}`).emit("incident:update", { incidentId: incident._id, status: incident.status, assignedUnitId: incident.assignedUnitId });

    const assignedUnit = nearest
      ? { _id: nearest._id, type: nearest.type, name: nearest.name, location: nearest.location }
      : null;
    return res.json({ incident, assignedUnit });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to report incident" });
  }
}

module.exports = { report };