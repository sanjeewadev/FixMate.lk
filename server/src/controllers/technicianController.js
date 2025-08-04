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

// Technician login
const loginTechnician = async (req, res) => {
  try {
    const { email, password } = req.body;

    const technician = await Technician.findOne({ email });
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    const isMatch = await bcrypt.compare(password, technician.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      technician: {
        id: technician._id,
        full_name: technician.full_name,
        email: technician.email,
        phone_number: technician.phone_number,
        address: technician.address,
        district: technician.district,
        profile_image_url: technician.profile_image_url,
        specialization: technician.specialization,
        experience_years: technician.experience_years,
        availability_status: technician.availability_status,
        rating: technician.rating,
        assigned_jobs_count: technician.assigned_jobs_count
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = {
  registerTechnician,
  loginTechnician
};

