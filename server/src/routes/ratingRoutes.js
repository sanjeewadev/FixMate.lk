const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { rateTechnician } = require('../controllers/ratingController');

// Customer rates a completed job
router.post(
  '/bookings/:id/rate',
  verifyToken, requireRole('customer'),
  rateTechnician
);

module.exports = router;
