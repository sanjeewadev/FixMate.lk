const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');

// DO NOT change your uploader; just pick a folder name:
const getUploadMiddleware = require('../middleware/cloudinaryUploader');
// Saves to: fixmate/bookings/customer-media
const uploadBookingMedia = getUploadMiddleware('bookings/customer-media');

const {
  createBooking,
  listMyBookings,
  listAvailableForTechnician,
  technicianAccept,
  technicianDecline,
  getTechnicianBooking,
  listPendingApproval,
  coordinatorApprove,
  getBooking,
  cancelMyBooking,
  listMineForTechnician
} = require('../controllers/bookingController');

// CUSTOMER
router.post(
  '/bookings',
  verifyToken, requireRole('customer'),
  uploadBookingMedia.array('media', 8), // images only (per your uploader)
  createBooking
);

router.get(
  '/bookings/mine',
  verifyToken, requireRole('customer'),
  listMyBookings
);

// Anyone with access (controller enforces access rules)
router.get(
  '/bookings/:id',
  verifyToken,
  getBooking
);

router.post(
  '/bookings/:id/cancel',
  verifyToken, requireRole('customer'),
  cancelMyBooking
);



// TECHNICIAN
router.get(
  '/technician/bookings/available',
  verifyToken, requireRole('technician'),
  listAvailableForTechnician
);

router.get(
  '/technician/bookings/mine',
  verifyToken, requireRole('technician'),
  listMineForTechnician
);

router.get(
  '/technician/bookings/:id',
  verifyToken, requireRole('technician'),
  getTechnicianBooking
);

router.post(
  '/technician/bookings/:id/accept',
  verifyToken, requireRole('technician'),
  technicianAccept
);

router.post(
  '/technician/bookings/:id/decline',
  verifyToken, requireRole('technician'),
  technicianDecline
);



// COORDINATOR / ADMIN / SUPER ADMIN
router.get(
  '/coordinator/bookings/pending-approval',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  listPendingApproval
);

router.post(
  '/coordinator/bookings/:id/approve',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  coordinatorApprove
);

module.exports = router;
