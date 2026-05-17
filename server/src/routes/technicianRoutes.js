const express = require("express");
const {
  registerTechnician,
  loginTechnician,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  changeMyProfileImage,
} = require("../controllers/technicianController");

//  Middlewares
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

const router = express.Router();

//  Upload middleware for technicians
// Profile images go under: fixmate/technicians
const upload = getUploadMiddleware("technicians");

// Auth
router.post("/register", upload.single("profile_image"), registerTechnician);
router.post("/login", loginTechnician);

// Technician self-account routes
router.get("/me", verifyToken, requireRole("technician"), getMyProfile);
router.patch("/me", verifyToken, requireRole("technician"), updateMyProfile);
router.patch(
  "/me/password",
  verifyToken,
  requireRole("technician"),
  changeMyPassword,
);

// Change profile picture
router.post(
  "/me/avatar",
  verifyToken,
  requireRole("technician"),
  upload.single("profile_image"),
  changeMyProfileImage,
);

module.exports = router;
