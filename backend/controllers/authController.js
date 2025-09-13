const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const axios = require("axios");

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
    
    // Store user info in session
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminType: user.adminType
    };
    req.session.token = token;
    
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

async function emailRegister(req, res) {
  try {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !phone) {
      return res.status(400).json({ message: "Email, password, and contact number are required" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "User already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      name: name || email.split('@')[0], // Use email prefix as name if not provided
      phone,
      passwordHash, 
      role: role || "citizen" 
    });
    const token = jwt.sign(
      { userId: user._id, role: user.role, adminType: user.adminType },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    
    // Store user info in session
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      adminType: user.adminType
    };
    req.session.token = token;
    
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
    
    // Store user info in session
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminType: user.adminType
    };
    req.session.token = token;
    
    return res.json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Login failed" });
  }
}

// Facebook login: verify access token, create user, return JWT
async function facebookLogin(req, res) {
  try {
    const { accessToken, userInfo } = req.body;
    
    if (!accessToken || !userInfo) {
      return res.status(400).json({ message: "Access token and user info required" });
    }

    // Verify the access token with Facebook
    const verifyUrl = `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`;
    const response = await axios.get(verifyUrl);
    
    if (!response.data || response.data.id !== userInfo.id) {
      return res.status(401).json({ message: "Invalid Facebook token" });
    }

    const facebookUser = response.data;
    const email = facebookUser.email || `${facebookUser.id}@facebook.com`;
    
    let user = await User.findOne({ $or: [{ email }, { facebookId: facebookUser.id }] });
    
    if (!user) {
      user = await User.create({
        email,
        name: facebookUser.name,
        avatarUrl: facebookUser.picture?.data?.url,
        facebookId: facebookUser.id,
        role: "citizen" // Default role
      });
    } else {
      // Update existing user with Facebook info
      user.facebookId = facebookUser.id;
      if (!user.avatarUrl && facebookUser.picture?.data?.url) {
        user.avatarUrl = facebookUser.picture.data.url;
      }
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, adminType: user.adminType },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    
    // Store user info in session
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminType: user.adminType
    };
    req.session.token = token;
    
    return res.json({ token, user });
  } catch (error) {
    console.error("Facebook login error:", error);
    return res.status(500).json({ message: "Facebook login failed" });
  }
}

// Instagram login: verify access token, create user, return JWT
async function instagramLogin(req, res) {
  try {
    const { accessToken, userInfo } = req.body;
    
    if (!accessToken || !userInfo) {
      return res.status(400).json({ message: "Access token and user info required" });
    }

    // Verify the access token with Instagram
    const verifyUrl = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`;
    const response = await axios.get(verifyUrl);
    
    if (!response.data || response.data.id !== userInfo.id) {
      return res.status(401).json({ message: "Invalid Instagram token" });
    }

    const instagramUser = response.data;
    const email = `${instagramUser.username}@instagram.com`; // Instagram doesn't provide email
    
    let user = await User.findOne({ $or: [{ email }, { instagramId: instagramUser.id }] });
    
    if (!user) {
      user = await User.create({
        email,
        name: instagramUser.username,
        instagramId: instagramUser.id,
        role: "citizen" // Default role
      });
    } else {
      // Update existing user with Instagram info
      user.instagramId = instagramUser.id;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, adminType: user.adminType },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    
    // Store user info in session
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminType: user.adminType
    };
    req.session.token = token;
    
    return res.json({ token, user });
  } catch (error) {
    console.error("Instagram login error:", error);
    return res.status(500).json({ message: "Instagram login failed" });
  }
}

module.exports = { googleLogin, facebookLogin, instagramLogin, setRole, emailRegister, emailLogin };