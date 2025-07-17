const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone_number: { type: String, required: true },
  profile_image_url: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
