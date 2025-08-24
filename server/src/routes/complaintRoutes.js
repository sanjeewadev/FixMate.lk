const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  createComplaint,
  listMyComplaints,
  listAllComplaints,
  respondComplaint
} = require('../controllers/complaintController');

// Customer
router.post('/complaints', verifyToken, requireRole('customer'), createComplaint);
router.get('/complaints/mine', verifyToken, requireRole('customer'), listMyComplaints);
router.get('/complaints/my',   verifyToken, requireRole('customer'), listMyComplaints);

// Staff/Admin
router.get('/complaints', verifyToken, requireRole('coordinator','admin','super_admin'), listAllComplaints);
router.post('/complaints/:id/respond', verifyToken, requireRole('coordinator','admin','super_admin'), respondComplaint);
router.patch('/complaints/:id/respond', verifyToken, requireRole('coordinator','admin','super_admin'), respondComplaint);

module.exports = router;