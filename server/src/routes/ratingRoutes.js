const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  rateTechnician,
  listRatingsForStaff,
  getTechnicianRatingSummary,
} = require('../controllers/ratingController');

// Customer rates a completed job
router.post(
  '/bookings/:id/rate',
  verifyToken,
  requireRole('customer'),
  rateTechnician
);

// Staff/Admin: view all ratings with filters/pagination
router.get(
  '/ratings',
  verifyToken,
  requireRole('coordinator', 'admin', 'super_admin'),
  listRatingsForStaff
);

// Staff/Admin: per‑technician summary
router.get(
  '/technicians/:id/ratings/summary',
  verifyToken,
  requireRole('coordinator', 'admin', 'super_admin'),
  getTechnicianRatingSummary
);

module.exports = router;
