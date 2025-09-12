const mongoose = require("mongoose");

const GeoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" }, // [lng, lat]
  },
  { _id: false }
);

const ServiceUnitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["ambulance", "hospital", "police", "firebrigade"], required: true },
    location: { type: GeoPointSchema, required: true },
    isActive: { type: Boolean, default: true },
    assignedIncidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", default: null },
    adminOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceUnit", ServiceUnitSchema);