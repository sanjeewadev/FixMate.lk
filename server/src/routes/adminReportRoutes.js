const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  getPaymentSummary,
  getTopServices,
  getTopDistricts,
  getTopTechnicians,
  getHighestBooking,
  getDailySeries,
  getMonthlySeries,
} = require("../controllers/adminReportController");

// Admin or Super Admin only
const requireAdmin = (req, res, next) => requireRole(["admin", "super_admin"])(req, res, next);

// Summary totals
router.get(
  "/admin/reports/payments/summary",
  verifyToken,
  requireAdmin,
  getPaymentSummary
);

// Top services
router.get(
  "/admin/reports/payments/top-services",
  verifyToken,
  requireAdmin,
  getTopServices
);

// Top districts
router.get(
  "/admin/reports/payments/top-districts",
  verifyToken,
  requireAdmin,
  getTopDistricts
);

// Top technicians
router.get(
  "/admin/reports/payments/top-technicians",
  verifyToken,
  requireAdmin,
  getTopTechnicians
);

// Highest-earning single booking
router.get(
  "/admin/reports/payments/highest-booking",
  verifyToken,
  requireAdmin,
  getHighestBooking
);

// Daily series
router.get(
  "/admin/reports/payments/daily",
  verifyToken,
  requireAdmin,
  getDailySeries
);

// Monthly series
router.get(
  "/admin/reports/payments/monthly",
  verifyToken,
  requireAdmin,
  getMonthlySeries
);

module.exports = router;
