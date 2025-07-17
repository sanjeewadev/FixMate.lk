const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



// ✅ Admin Registration Function
const registerAdmin = async (req, res) => {
  try {
    const { full_name, email, password, phone_number, profile_image_url } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      full_name,
      email,
      password_hash,
      phone_number,
      profile_image_url
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully." });

  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ message: "Server error during admin registration." });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔐 Check if it's the Super Admin
    if (
      email === process.env.SUPER_ADMIN_EMAIL &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      // You can generate a token here if needed
      return res.status(200).json({
        message: "Super Admin login successful",
        role: "super_admin"
      });
    }

    // 🔐 Check in DB for normal admin
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.status(200).json({
      message: "Admin login successful",
      admin: {
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during admin login." });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin
};
