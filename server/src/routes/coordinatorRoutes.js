const express = require("express");
const { registerCoordinator } = require("../controllers/coordinatorController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader.js");

const router = express.Router();

const upload = getUploadMiddleware("coordinators"); // 📁 uploads to fixmate/coordinators

router.post("/register", upload.single("profile_image"), registerCoordinator);

module.exports = router;
