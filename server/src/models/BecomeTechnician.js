// models/BecomeTechnician.js
const mongoose = require('mongoose');

const becomeTechnicianSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone_number: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  profile_image_url: { type: String, default: "" },
  specialization: { type: String, required: true },
  experience_years: { type: Number, default: 0 },
  note: { type: String, default: "" }, // motivation / message
  status: { type: String, enum: ['new','reviewed','converted','rejected'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model("BecomeTechnician", becomeTechnicianSchema);
