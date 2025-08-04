const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/customerController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

const upload = getUploadMiddleware("customers"); // folder: fixmate/customers

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);

module.exports = router;
