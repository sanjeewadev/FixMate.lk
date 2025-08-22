const express = require("express");
const { applyTechnician, deleteMyApplication } = require("../controllers/becomeTechnicianController");
const getUploadMiddleware = require("../middleware/cloudinaryUploader");

const router = express.Router();
const upload = getUploadMiddleware("technician_applications");

router.post("/", upload.single("profile_image"), applyTechnician);

// NEW: applicant self-delete (body must include { email })
router.delete("/:id", deleteMyApplication);

module.exports = router;
