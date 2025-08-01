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



module.exports = {
  registerAdmin,

};
