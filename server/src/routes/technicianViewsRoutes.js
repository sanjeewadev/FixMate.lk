const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

const {
  listTechniciansForTech,
  listCustomersPublicForTech,
} = require("../controllers/technicianViewsController");

// Technicians list (full info, no passwords)
router.get(
  "/technician/technicians",
  verifyToken,
  requireRole("technician"),
  listTechniciansForTech
);

// Customers public view (no personal details)
router.get(
  "/technician/customers/public",
  verifyToken,
  requireRole("technician"),
  listCustomersPublicForTech
);

module.exports = router;
