const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
  listReceipts,
  getReceipt,
  downloadReceiptPdf
} = require('../controllers/customerReceiptController');

// List all past receipts (completed bookings with payment)
router.get(
  '/customer/bookings/receipts',
  verifyToken,
  requireRole('customer'),
  listReceipts
);

// Get a single receipt by booking id
router.get(
  '/customer/bookings/:id/receipt',
  verifyToken,
  requireRole('customer'),
  getReceipt
);

// Download PDF receipt
router.get(
  '/customer/bookings/:id/receipt.pdf',
  verifyToken,
  requireRole('customer'),
  downloadReceiptPdf
);

module.exports = router;
