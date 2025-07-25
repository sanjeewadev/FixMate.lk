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
      profile_image_url,
      specialization,
      experience_years
    } = req.body;

    const existing = await Technician.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Technician already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newTechnician = new Technician({
      full_name,
      email,
      password_hash,
      phone_number,
      address,
      district,
      profile_image_url,
      specialization,
      experience_years
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
