const express = require("express");
const { registerTechnician } = require("../controllers/technicianController");

const router = express.Router();

router.post("/register", registerTechnician);


module.exports = router;
