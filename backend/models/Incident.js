const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["text", "image", "video", "audio"], required: true },
    content: { type: String, required: true }, // text or URL/base64
  },
  { _id: false }
);

const GeoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" }, // [lng, lat]
  },
  { _id: false }
);

const IncidentSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String },
    media: { type: [MediaSchema], default: [] },
    location: { type: GeoPointSchema, required: true },
    classifiedService: { type: String, enum: ["ambulance", "hospital", "police", "firebrigade"], default: null },
    assignedUnitId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceUnit", default: null },
    status: { type: String, enum: ["reported", "dispatched", "enroute", "resolved"], default: "reported" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", IncidentSchema);


