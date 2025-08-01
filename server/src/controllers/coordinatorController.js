const Coordinator = require("../models/Coordinator");
const bcrypt = require("bcryptjs");

// Register a new coordinator
const registerCoordinator = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone_number,
      address,
      district
    } = req.body;

    // Check if image was uploaded
    const profile_image_url = req.file ? req.file.path : "";

    if (!full_name || !email || !password || !address || !district || !profile_image_url) {
      return res.status(400).json({ message: "Please fill in all required fields including profile image." });
    }

    const existing = await Coordinator.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Coordinator already exists with this email." });
    }

    

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newCoordinator = new Coordinator({
      full_name,
      email,
      password_hash,
      phone_number,
      address,
      district,
      profile_image_url
    });

    await newCoordinator.save();
    res.status(201).json({ message: "Coordinator registered successfully." });

  } catch (error) {
    console.error("Error registering coordinator:", error);
    res.status(500).json({ message: "Server error during coordinator registration." });
  }
};
// Coordinator login
const loginCoordinator = async (req, res) => {
  try {
    const { email, password } = req.body;

    const coordinator = await Coordinator.findOne({ email });
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    const isMatch = await bcrypt.compare(password, coordinator.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      coordinator: {
        id: coordinator._id,
        full_name: coordinator.full_name,
        email: coordinator.email,
        phone_number: coordinator.phone_number,
        address: coordinator.address,
        district: coordinator.district,
        profile_image_url: coordinator.profile_image_url
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = {
  registerCoordinator,
  loginCoordinator
};
