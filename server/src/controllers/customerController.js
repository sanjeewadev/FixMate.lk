const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

// Register a new customer
const register = async (req, res) => {
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

    // Validation
    if (!full_name || !email || !password || !address || !district) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // Check if email already exists
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new customer
    const newCustomer = new Customer({
      full_name,
      email,
      phone_number,
      address,
      district,
      profile_image_url,
      password_hash: hashedPassword,
    });

    await newCustomer.save();

    res.status(201).json({ message: "Customer registered successfully." });
  } catch (err) {
  console.error("❌ Register error:", err); // Add this
  res.status(500).json({ message: "Server error during registration." });
}
};



module.exports = {
  register,
  
};
