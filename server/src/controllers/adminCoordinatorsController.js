// controllers/adminCoordinatorsController.js
const Coordinator = require('../models/Coordinator');
const bcrypt = require('bcryptjs');

exports.listCoordinators = async (_req, res) => {
  const items = await Coordinator.find({}).select("-password_hash").sort({ createdAt: -1 });
  res.json(items);
};

exports.createCoordinator = async (req, res) => {
  const { full_name, email, password, phone_number, profile_image_url } = req.body;
  if (!full_name || !email || !password || !phone_number) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const exists = await Coordinator.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  const password_hash = await bcrypt.hash(password, 10);
  const doc = await Coordinator.create({ full_name, email, password_hash, phone_number, profile_image_url: profile_image_url || "" });
  res.status(201).json({ message: "Coordinator created", id: doc._id });
};

exports.updateCoordinator = async (req, res) => {
  const { id } = req.params;
  const allowed = ['full_name','email','phone_number','profile_image_url'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const out = await Coordinator.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select("-password_hash");
  if (!out) return res.status(404).json({ message: "Coordinator not found" });
  res.json({ message: "Coordinator updated", coordinator: out });
};

exports.deleteCoordinator = async (req, res) => {
  const { id } = req.params;
  const out = await Coordinator.findByIdAndDelete(id);
  if (!out) return res.status(404).json({ message: "Coordinator not found" });
  res.json({ message: "Coordinator deleted" });
};
