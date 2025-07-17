const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  phone_number: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  profile_image_url: { type: String, default: "" },
  specialization: { type: String, required: true },
  experience_years: { type: Number, default: 0 },
  availability_status: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  assigned_jobs_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Technician", technicianSchema);
