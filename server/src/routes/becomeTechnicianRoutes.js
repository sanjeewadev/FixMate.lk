// routes/becomeTechnicianRoutes.js
const express = require("express");
const { applyTechnician } = require("../controllers/becomeTechnicianController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

const router = express.Router();
const upload = getUploadMiddleware("technician_applications");

router.post("/", upload.single("profile_image"), applyTechnician);

module.exports = router;
