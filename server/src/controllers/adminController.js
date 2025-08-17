// controllers/adminController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

// ---------- Auth (yours, with a small tidy) ----------
exports.registerAdmin = async (req, res) => {
  try {
    const { full_name, email, password, phone_number } = req.body;
    if (!full_name || !email || !password || !phone_number) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Admin already exists with this email." });

    const profile_image_url = req.file ? req.file.path : "";
    const password_hash = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      full_name, email, password_hash, phone_number, profile_image_url, role: 'admin'
    });

    res.status(201).json({ message: "Admin registered successfully.", id: newAdmin._id });
  } catch (e) {
    console.error("Admin registration error:", e);
    res.status(500).json({ message: "Server error during admin registration." });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // SUPER ADMIN (env)
    if (email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
      const token = jwt.sign({ id: "super_admin_id", role: "super_admin" }, process.env.JWT_SECRET, { expiresIn: "2d" });
      return res.status(200).json({ message: "Super Admin login successful", role: "super_admin", token });
    }

    // Normal admin (DB)
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2d" });
    res.status(200).json({
      message: "Admin login successful",
      role: "admin",
      token,
      admin: { id: admin._id, full_name: admin.full_name, email: admin.email, phone_number: admin.phone_number, profile_image_url: admin.profile_image_url }
    });
  } catch (e) {
    console.error("Admin login error:", e);
    res.status(500).json({ message: "Server error during admin login." });
  }
};

// ---------- My Profile (Admin) ----------
exports.getMyProfile = async (req, res) => {
  try {
    if (!['admin','super_admin'].includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' });

    if (req.user.role === 'super_admin') {
      // env super admin: minimal profile
      return res.json({
        id: "super_admin_id",
        full_name: "Super Admin",
        email: process.env.SUPER_ADMIN_EMAIL,
        phone_number: "",
        profile_image_url: "",
        role: "super_admin"
      });
    }

    const me = await Admin.findById(req.user.id).select("-password_hash");
    if (!me) return res.status(404).json({ message: "Admin not found" });
    res.json(me);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      // super admin in env has nothing to update in DB
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowed = ['full_name','phone_number'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const out = await Admin.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true })
      .select("-password_hash");
    res.json({ message: "Profile updated", admin: out });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.changeMyPassword = async (req, res) => {
  try {
    if (!['admin','super_admin'].includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' });

    if (req.user.role === 'super_admin') {
      return res.status(400).json({ message: "Super Admin (env) password can't be changed here" });
    }

    const { currentPassword, newPassword } = req.body || {};
    const me = await Admin.findById(req.user.id);
    if (!me) return res.status(404).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(currentPassword, me.password_hash);
    if (!ok) return res.status(400).json({ message: "Current password incorrect" });

    me.password_hash = await bcrypt.hash(newPassword, 10);
    await me.save();
    res.json({ message: "Password changed" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.changeMyProfileImage = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const profile_image_url = req.file ? req.file.path : null;
    if (!profile_image_url) return res.status(400).json({ message: 'No image uploaded' });

    const out = await Admin.findByIdAndUpdate(req.user.id, { profile_image_url }, { new: true }).select("-password_hash");
    res.json({ message: "Profile image updated", admin: out });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
