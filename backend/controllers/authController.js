const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google login: verify ID token (or accept mock payload in dev), create user, return JWT
async function googleLogin(req, res) {
  try {
    const { idToken, email, name, avatarUrl } = req.body;

    let payload = null;
    if (idToken) {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    }

    const finalEmail = payload?.email || email;
    if (!finalEmail) return res.status(400).json({ message: "Email required" });

    let user = await User.findOne({ email: finalEmail });
    if (!user) {
      user = await User.create({
        email: finalEmail,
        name: payload?.name || name,
        avatarUrl: payload?.picture || avatarUrl,
        googleId: payload?.sub || undefined,
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, adminType: user.adminType },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    return res.json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Login failed" });
  }
}

async function setRole(req, res) {
  try {
    const { role, adminType } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = role || user.role;
    user.adminType = role === "admin" ? adminType || user.adminType : null;
    await user.save();
    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to set role" });
  }
}

module.exports = { googleLogin, setRole };

async function emailRegister(req, res) {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "User already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash, role: role || "citizen" });
    const token = jwt.sign(
      { userId: user._id, role: user.role, adminType: user.adminType },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    return res.json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Register failed" });
  }
}

async function emailLogin(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { userId: user._id, role: user.role, adminType: user.adminType },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    return res.json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Login failed" });
  }
}

module.exports.emailRegister = emailRegister;
module.exports.emailLogin = emailLogin;