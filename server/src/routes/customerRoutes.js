const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  changeProfileImage
} = require("../controllers/customerController");

const router = express.Router();

// Save customer avatars under: fixmate/profiles/customers
const uploadCustomerAvatar = getUploadMiddleware("profiles/customers");

// Auth
router.post("/customer/register", uploadCustomerAvatar.single("profile_image"), register);
router.post("/customer/login", login);

// Profile
router.get("/customer/me", verifyToken, requireRole("customer"), getProfile);
router.patch("/customer/me", verifyToken, requireRole("customer"), updateProfile);
router.patch("/customer/me/password", verifyToken, requireRole("customer"), changePassword);

// Change profile picture (form-data: profile_image)
router.post(
  "/customer/me/avatar",
  verifyToken,
  requireRole("customer"),
  uploadCustomerAvatar.single("profile_image"),
  changeProfileImage
);

module.exports = router;
