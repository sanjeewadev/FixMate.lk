const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone_number, address, district } =
      req.body;

    // Validation
    if (!full_name || !email || !password || !address || !district) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    // Check if email already exists
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    //  Get Cloudinary URL
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
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// Login customer
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Please check your inputs 😣" });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect 😣" });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect 😣" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "2d" },
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

const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).select(
      "-password_hash",
    );
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "full_name",
      "phone_number",
      "address",
      "district",
      "profile_image_url",
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password_hash");

    res.json({ message: "Profile updated", customer: updatedCustomer });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      customer.password_hash,
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password_hash = hashedPassword;
    await customer.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error during password change" });
  }
};

const changeProfileImage = async (req, res) => {
  try {
    if (req.user?.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const profile_image_url = req.file ? req.file.path : null; // Cloudinary secure URL
    if (!profile_image_url) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const updated = await Customer.findByIdAndUpdate(
      req.user.id,
      { profile_image_url },
      { new: true },
    ).select("-password_hash");

    if (!updated)
      return res.status(404).json({ message: "Customer not found" });

    res.json({ message: "Profile picture updated", customer: updated });
  } catch (err) {
    console.error("Change avatar error:", err);
    res
      .status(500)
      .json({ message: "Server error while changing profile picture" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  changeProfileImage,
};
