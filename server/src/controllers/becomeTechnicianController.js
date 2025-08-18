// controllers/becomeTechnicianController.js
const BecomeTechnician = require("../models/BecomeTechnician");

const applyTechnician = async (req, res) => {
  try {
    const { full_name, email, phone_number, address, district, specialization, experience_years, note } = req.body;

    const profile_image_url = req.file ? req.file.path : "";

    const newApp = new BecomeTechnician({
      full_name,
      email,
      phone_number,
      address,
      district,
      specialization,
      experience_years,
      note,
      profile_image_url
    });

    await newApp.save();
    res.status(201).json({ message: "Application submitted successfully", application: newApp });
  } catch (err) {
    console.error("Apply technician error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { applyTechnician };
