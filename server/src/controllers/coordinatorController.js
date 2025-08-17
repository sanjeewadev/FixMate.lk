const Coordinator = require("../models/Coordinator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    // Generate JWT token
    const token = jwt.sign(
      { id: coordinator._id, role: "coordinator" },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
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



// GET /api/coordinator/me
const getMyProfile = async (req, res) => {
  try {
    if (req.user?.role !== "coordinator") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const me = await Coordinator.findById(req.user.id).select("-password_hash");
    if (!me) return res.status(404).json({ message: "Coordinator not found" });
    res.json(me);
  } catch (e) {
    console.error("Get profile error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/coordinator/me
// body: { full_name?, phone_number?, address?, district? }
const updateMyProfile = async (req, res) => {
  try {
    if (req.user?.role !== "coordinator") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const allowed = ["full_name", "phone_number", "address", "district"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const out = await Coordinator.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password_hash");

    if (!out) return res.status(404).json({ message: "Coordinator not found" });
    res.json({ message: "Profile updated", coordinator: out });
  } catch (e) {
    console.error("Update profile error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/coordinator/me/password
// body: { currentPassword, newPassword }
const changeMyPassword = async (req, res) => {
  try {
    if (req.user?.role !== "coordinator") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const me = await Coordinator.findById(req.user.id);
    if (!me) return res.status(404).json({ message: "Coordinator not found" });

    const ok = await bcrypt.compare(currentPassword, me.password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    me.password_hash = await bcrypt.hash(newPassword, 10);
    await me.save();

    res.json({ message: "Password changed successfully" });
  } catch (e) {
    console.error("Change password error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/coordinator/me/avatar  (form-data key: profile_image)
// requires your Cloudinary uploader middleware
const changeMyProfileImage = async (req, res) => {
  try {
    if (req.user?.role !== "coordinator") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const profile_image_url = req.file ? req.file.path : null;
    if (!profile_image_url) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const out = await Coordinator.findByIdAndUpdate(
      req.user.id,
      { profile_image_url },
      { new: true }
    ).select("-password_hash");

    if (!out) return res.status(404).json({ message: "Coordinator not found" });
    res.json({ message: "Profile image updated", coordinator: out });
  } catch (e) {
    console.error("Change avatar error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerCoordinator,
  loginCoordinator,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  changeMyProfileImage
};
