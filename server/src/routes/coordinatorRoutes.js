const express = require("express");
const { registerCoordinator } = require("../controllers/coordinatorController");

const router = express.Router();

router.post("/register", registerCoordinator);


module.exports = router;
