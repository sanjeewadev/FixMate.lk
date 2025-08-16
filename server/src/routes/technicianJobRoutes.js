const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const getUploadMiddleware = require('../middleware/cloudinaryUploader');

// Store expense images under fixmate/bookings/expenses
const uploadExpenseMedia = getUploadMiddleware('bookings/expenses');

const {
  updateLiveStatus,
  addExpenses,
  updateNotes,
  completeAndConfirmPayment
} = require('../controllers/technicianJobController');

router.patch(
  '/technician/bookings/:id/status',
  verifyToken, requireRole('technician'),
  updateLiveStatus
);

router.post(
  '/technician/bookings/:id/expenses',
  verifyToken, requireRole('technician'),
  uploadExpenseMedia.array('attachments', 8),
  addExpenses
);

router.patch(
  '/technician/bookings/:id/notes',
  verifyToken, requireRole('technician'),
  updateNotes
);

router.post(
  '/technician/bookings/:id/complete',
  verifyToken, requireRole('technician'),
  completeAndConfirmPayment
);

module.exports = router;
