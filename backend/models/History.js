const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true },
    status: { type: String, enum: ["reported", "dispatched", "enroute", "resolved"], default: "reported" },
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", HistorySchema);