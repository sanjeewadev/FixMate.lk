const express = require("express");
const { registerCoordinator, loginCoordinator } = require("../controllers/coordinatorController");

const router = express.Router();

router.post("/register", registerCoordinator);
router.post("/login", loginCoordinator);

module.exports = router;
