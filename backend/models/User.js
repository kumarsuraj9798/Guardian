const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    emergencyContact: { type: String },
    avatarUrl: { type: String },
    passwordHash: { type: String },
    // role: 'citizen' | 'admin'
    role: { type: String, enum: ["citizen", "admin"], default: "citizen" },
    // adminType: for admins: 'ambulance' | 'hospital' | 'police' | 'firebrigade'
    adminType: { 
      type: String, 
      enum: ["ambulance", "hospital", "police", "firebrigade"], 
      required: false,
      default: undefined 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);