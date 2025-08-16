const Technician = require("../models/Technician");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    // Generate JWT token
            const token = jwt.sign(
              { id: technician._id, role: "technician" },
              process.env.JWT_SECRET,
              { expiresIn: "2d" }
            );

    res.status(200).json({
      message: "Login successful",
      token,
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

// GET /api/technician/me
const getMyProfile = async (req, res) => {
  try {
    if (req.user?.role !== "technician") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const me = await Technician.findById(req.user.id).select("-password_hash");
    if (!me) return res.status(404).json({ message: "Technician not found" });
    res.json(me);
  } catch (e) {
    console.error("Tech get profile error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/technician/me
// body: { full_name?, phone_number?, address?, district?, specialization?, experience_years?, availability_status? }
const updateMyProfile = async (req, res) => {
  try {
    if (req.user?.role !== "technician") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = [
      "full_name",
      "phone_number",
      "address",
      "district",
      "specialization",
      "experience_years",
      "availability_status"
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // Optional: prevent email change by tech (safer). If you want to allow it, add 'email' to allowed and also check uniqueness.
    if (req.body.email !== undefined) {
      return res.status(400).json({ message: "Email cannot be changed here" });
    }

    const out = await Technician.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password_hash");

    if (!out) return res.status(404).json({ message: "Technician not found" });
    res.json({ message: "Profile updated", technician: out });
  } catch (e) {
    console.error("Tech update profile error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/technician/me/password
// body: { currentPassword, newPassword }
const changeMyPassword = async (req, res) => {
  try {
    if (req.user?.role !== "technician") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const me = await Technician.findById(req.user.id);
    if (!me) return res.status(404).json({ message: "Technician not found" });

    const ok = await bcrypt.compare(currentPassword, me.password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    me.password_hash = await bcrypt.hash(newPassword, 10);
    await me.save();

    res.json({ message: "Password changed successfully" });
  } catch (e) {
    console.error("Tech change password error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/technician/me/avatar  (form-data key: profile_image)
// uses your Cloudinary uploader
const changeMyProfileImage = async (req, res) => {
  try {
    if (req.user?.role !== "technician") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const profile_image_url = req.file ? req.file.path : null;
    if (!profile_image_url) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const out = await Technician.findByIdAndUpdate(
      req.user.id,
      { profile_image_url },
      { new: true }
    ).select("-password_hash");

    if (!out) return res.status(404).json({ message: "Technician not found" });
    res.json({ message: "Profile image updated", technician: out });
  } catch (e) {
    console.error("Tech change avatar error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerTechnician,
  loginTechnician,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  changeMyProfileImage
};
