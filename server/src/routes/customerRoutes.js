const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword } = require("../controllers/customerController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");
const verifyToken = require("../middleware/verifyToken"); // If using JWT


const upload = getUploadMiddleware("customers"); // folder: fixmate/customers

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
