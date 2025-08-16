// controllers/adminAdminsController.js
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

exports.listAdmins = async (_req, res) => {
  const items = await Admin.find({}).select("-password_hash").sort({ createdAt: -1 });
  res.json(items);
};

exports.createAdmin = async (req, res) => {
  if (!['admin','super_admin'].includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' });

  const { full_name, email, password, phone_number, profile_image_url } = req.body;
  if (!full_name || !email || !password || !phone_number) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  const password_hash = await bcrypt.hash(password, 10);
  const doc = await Admin.create({ full_name, email, password_hash, phone_number, profile_image_url: profile_image_url || "", role: 'admin' });

  res.status(201).json({ message: "Admin created", id: doc._id });
};

exports.updateAdmin = async (req, res) => {
  if (!['admin','super_admin'].includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;

  const allowed = ['full_name','email','phone_number','profile_image_url'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const out = await Admin.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select("-password_hash");
  if (!out) return res.status(404).json({ message: "Admin not found" });
  res.json({ message: "Admin updated", admin: out });
};

exports.deleteAdmin = async (req, res) => {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ message: 'Only Super Admin can delete admins' });
  const { id } = req.params;
  const out = await Admin.findByIdAndDelete(id);
  if (!out) return res.status(404).json({ message: "Admin not found" });
  res.json({ message: "Admin deleted" });
};
