const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

// Login customer
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      customer: {
        id: customer._id,
        full_name: customer.full_name,
        email: customer.email,
        phone_number: customer.phone_number,
        address: customer.address,
        district: customer.district,
        profile_image_url: customer.profile_image_url,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = {
  register,
  login,
};
