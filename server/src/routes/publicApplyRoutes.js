// routes/publicApplyRoutes.js
const router = require('express').Router();
const getUploadMiddleware = require('../middleware/cloudinaryUploader');
const uploadAvatar = getUploadMiddleware('profiles/tech-applicants');
const BecomeTechnician = require('../models/BecomeTechnician');

router.post('/apply/technician', uploadAvatar.single('profile_image'), async (req, res) => {
  try {
    const { full_name, email, phone_number, address, district, specialization, experience_years = 0, note = "" } = req.body;
    if (!full_name || !email || !phone_number || !address || !district || !specialization) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const profile_image_url = req.file ? req.file.path : "";
    const doc = await BecomeTechnician.create({
      full_name, email, phone_number, address, district, specialization,
      experience_years, note, profile_image_url
    });
    res.status(201).json({ message: "Application submitted", id: doc._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
