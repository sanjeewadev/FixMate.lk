const express = require("express");
const { registerTechnician, loginTechnician } = require("../controllers/technicianController");

const router = express.Router();

router.post("/register", registerTechnician);
router.post("/login", loginTechnician);

module.exports = router;
