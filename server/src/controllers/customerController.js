const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");


const register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone_number,
      address,
      district
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

    // ✅ Get Cloudinary URL
    const profile_image_url = req.file ? req.file.path : ""; // auto-generated public URL from Cloudinary

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
      profile_image_url, // store the URL in DB
      password_hash: hashedPassword,
    });

    await newCustomer.save();

    res.status(201).json({ message: "Customer registered successfully." });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

module.exports = {
  register,
};
