const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

// Save coordinator avatars under: fixmate/profiles/coordinators
const uploadCoordinatorAvatar = getUploadMiddleware("profiles/coordinators");

const {
  registerCoordinator,
  loginCoordinator,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  changeMyProfileImage
} = require("../controllers/coordinatorController");

// Auth
router.post("/coordinator/register", uploadCoordinatorAvatar.single("profile_image"), registerCoordinator);
router.post("/coordinator/login", loginCoordinator);

// Account
router.get("/coordinator/me", verifyToken, requireRole("coordinator"), getMyProfile);
router.patch("/coordinator/me", verifyToken, requireRole("coordinator"), updateMyProfile);
router.patch("/coordinator/me/password", verifyToken, requireRole("coordinator"), changeMyPassword);
router.post(
  "/coordinator/me/avatar",
  verifyToken,
  requireRole("coordinator"),
  uploadCoordinatorAvatar.single("profile_image"),
  changeMyProfileImage
);

module.exports = router;
