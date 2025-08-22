// routes/adminReportRoutes.js (or wherever this router lives)
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

// Call with separate args (NOT an array)
const requireAdmin = requireRole("admin", "super_admin");

// If this router is mounted at: app.use("/api/admin", router)
// then your paths should be like "/reports/..." (no extra /admin)
router.get("/reports/payments/summary",        verifyToken, requireAdmin, getPaymentSummary);
router.get("/reports/payments/top-services",   verifyToken, requireAdmin, getTopServices);
router.get("/reports/payments/top-districts",  verifyToken, requireAdmin, getTopDistricts);
router.get("/reports/payments/top-technicians",verifyToken, requireAdmin, getTopTechnicians);
router.get("/reports/payments/highest-booking",verifyToken, requireAdmin, getHighestBooking);
router.get("/reports/payments/daily",          verifyToken, requireAdmin, getDailySeries);
router.get("/reports/payments/monthly",        verifyToken, requireAdmin, getMonthlySeries);

module.exports = router;
