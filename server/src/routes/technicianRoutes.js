const express = require("express");
const { registerTechnician } = require("../controllers/technicianController");

// ✅ Import the middleware
const getUploadMiddleware = require("../middleware/cloudinaryUploader"); // Adjust path if needed

const router = express.Router();

// ✅ Set up upload middleware for technicians
const upload = getUploadMiddleware("technicians"); // 📁 uploads to fixmate/technicians

router.post("/register", upload.single("profile_image"), registerTechnician);

module.exports = router;