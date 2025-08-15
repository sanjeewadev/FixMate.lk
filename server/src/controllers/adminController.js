const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Admin Registration Function
const registerAdmin = async (req, res) => {
  try {
    const { full_name, email, password, phone_number } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists with this email." });
    }

    // ✅ Get Cloudinary URL
   const profile_image_url = req.file ? req.file.path : "";

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
      // Generate Super Admin JWT
      const token = jwt.sign(
        { id: "super_admin_id", role: "super_admin" }, // id can be static or from DB if stored
        process.env.JWT_SECRET,
        { expiresIn: "2d" }
      );

      return res.status(200).json({
        message: "Super Admin login successful",
        role: "super_admin",
        token
      });
    }

    // 🔍 Check DB for normal admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token for normal admin
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.status(200).json({
      message: "Admin login successful",
      token,
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
