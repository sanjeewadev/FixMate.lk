const { loginAdmin } = require("../controllers/adminController");
const express = require("express");
const { registerAdmin } = require("../controllers/adminController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader.js");


const router = express.Router();

const upload = getUploadMiddleware("admins"); // 📁 uploads to fixmate/admins

router.post("/register", upload.single("profile_image"), registerAdmin);
router.post("/login", loginAdmin);

module.exports = router;
