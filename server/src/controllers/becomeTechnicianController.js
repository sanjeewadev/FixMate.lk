// controllers/becomeTechnicianController.js
const BecomeTechnician = require("../models/BecomeTechnician");

/**
 * Public: apply to become a technician
 */
const applyTechnician = async (req, res) => {
  try {
    const {
      full_name, email, phone_number, address, district,
      specialization, experience_years, note
    } = req.body;

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

/**
 * Public: applicant can delete their own application
 * Simple verification by matching email (sent in body) with the application.
 * Route: DELETE /api/become-technician/:id  body: { email }
 * (Adjust to your auth model if you later require login.)
 */
const deleteMyApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const app = await BecomeTechnician.findById(id);
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (app.email.toLowerCase() !== String(email).toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this application" });
    }

    await app.deleteOne();
    res.json({ message: "Application deleted" });
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { applyTechnician, deleteMyApplication };
