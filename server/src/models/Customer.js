const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone_number: String,
  address: { type: String, required: true },
  district: { type: String, required: true },
  profile_image_url: String,
  password_hash: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);
