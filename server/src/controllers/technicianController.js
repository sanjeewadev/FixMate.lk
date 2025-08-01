const Technician = require("../models/Technician");
const bcrypt = require("bcryptjs");

// Register new technician
const registerTechnician = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone_number,
      address,
      district,
      specialization,
      experience_years
    } = req.body;

    // Check if technician already exists
    const existing = await Technician.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Technician already exists with this email." });
    }

    // Optional: Handle uploaded image
    const profile_image_url = req.file ? req.file.path : ""; // or null if you prefer

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create new technician
    const newTechnician = new Technician({
      full_name,
      email,
      password_hash,
      phone_number,
      address,
      district,
      specialization,
      experience_years,
      profile_image_url
    });

    await newTechnician.save();

    res.status(201).json({ message: "Technician registered successfully." });

  } catch (error) {
    console.error("Error registering technician:", error);
    res.status(500).json({ message: "Server error during technician registration." });
  }
};

module.exports = {
  registerTechnician,
};
