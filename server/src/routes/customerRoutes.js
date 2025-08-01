const express = require("express");
const router = express.Router();
const { register } = require("../controllers/customerController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

const upload = getUploadMiddleware("customers"); // 📁 uploads to fixmate/customers

router.post("/register", upload.single("profile_image"), register);

module.exports = router;
