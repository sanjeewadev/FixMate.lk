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
      district,
      profile_image_url
    } = req.body;

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



module.exports = {
  registerCoordinator,

};
