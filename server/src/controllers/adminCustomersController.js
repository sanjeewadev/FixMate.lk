// controllers/adminCustomersController.js
const Customer = require('../models/Customer');
const bcrypt = require('bcryptjs');

exports.listCustomers = async (_req, res) => {
  const items = await Customer.find({}).select("-password_hash").sort({ createdAt: -1 });
  res.json(items);
};

exports.createCustomer = async (req, res) => {
  const { full_name, email, password, phone_number, address, district, profile_image_url } = req.body;
  if (!full_name || !email || !password || !address || !district) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const exists = await Customer.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  const password_hash = await bcrypt.hash(password, 10);
  const doc = await Customer.create({
    full_name, email, phone_number, address, district,
    profile_image_url: profile_image_url || ""
    , password_hash
  });
  res.status(201).json({ message: "Customer created", id: doc._id });
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const allowed = ['full_name','email','phone_number','address','district','profile_image_url'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const out = await Customer.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select("-password_hash");
  if (!out) return res.status(404).json({ message: "Customer not found" });
  res.json({ message: "Customer updated", customer: out });
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const out = await Customer.findByIdAndDelete(id);
  if (!out) return res.status(404).json({ message: "Customer not found" });
  res.json({ message: "Customer deleted" });
};
