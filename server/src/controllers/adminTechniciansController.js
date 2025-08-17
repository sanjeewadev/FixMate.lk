// controllers/adminTechniciansController.js
const Technician = require('../models/Technician');
const BecomeTechnician = require('../models/BecomeTechnician');
const bcrypt = require('bcryptjs');

exports.listTechnicians = async (_req, res) => {
  const items = await Technician.find({}).select("-password_hash").sort({ createdAt: -1 });
  res.json(items);
};

exports.createTechnician = async (req, res) => {
  const { full_name, email, password, phone_number, address, district, profile_image_url, specialization, experience_years = 0 } = req.body;
  if (!full_name || !email || !password || !phone_number || !address || !district || !specialization) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const exists = await Technician.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });

  const password_hash = await bcrypt.hash(password, 10);
  const doc = await Technician.create({
    full_name, email, password_hash, phone_number, address, district,
    profile_image_url: profile_image_url || "", specialization, experience_years
  });
  res.status(201).json({ message: "Technician created", id: doc._id });
};

exports.updateTechnician = async (req, res) => {
  const { id } = req.params;
  const allowed = ['full_name','email','phone_number','address','district','profile_image_url','specialization','experience_years','availability_status','rating'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const out = await Technician.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select("-password_hash");
  if (!out) return res.status(404).json({ message: "Technician not found" });
  res.json({ message: "Technician updated", technician: out });
};

exports.deleteTechnician = async (req, res) => {
  const { id } = req.params;
  const out = await Technician.findByIdAndDelete(id);
  if (!out) return res.status(404).json({ message: "Technician not found" });
  res.json({ message: "Technician deleted" });
};

// ----- Become Technician (public applications) -----
exports.listTechApplications = async (_req, res) => {
  const items = await BecomeTechnician.find({}).sort({ createdAt: -1 });
  res.json(items);
};

exports.convertApplicationToTechnician = async (req, res) => {
  const { id } = req.params;
  const app = await BecomeTechnician.findById(id);
  if (!app) return res.status(404).json({ message: "Application not found" });

  // Allow admin to edit fields on the fly
  const {
    full_name = app.full_name,
    email = app.email,
    password, // admin must set an initial password
    phone_number = app.phone_number,
    address = app.address,
    district = app.district,
    profile_image_url = app.profile_image_url,
    specialization = app.specialization,
    experience_years = app.experience_years
  } = req.body;

  if (!password) return res.status(400).json({ message: "Password is required to create technician" });

  const exists = await Technician.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already used by a technician" });

  const password_hash = await bcrypt.hash(password, 10);
  const tech = await Technician.create({
    full_name, email, password_hash, phone_number, address, district, profile_image_url, specialization, experience_years
  });

  app.status = 'converted';
  await app.save();

  res.json({ message: "Converted to technician", technicianId: tech._id });
};
