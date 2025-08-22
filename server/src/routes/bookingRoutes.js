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
  listMineForTechnician,
  listForCoordinator,
  coordinatorDashboard,
  coordinatorAssign,
  coordinatorReassign,
  coordinatorDelete
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

// Existing focused list: only items with accepts (awaiting coordinator)
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

// NEW: see ALL unassigned (includes brand-new 'pending')
router.get(
  '/coordinator/bookings',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  listForCoordinator
);

// NEW: dashboard buckets (unclaimed vs awaitingCoordinator)
router.get(
  '/coordinator/bookings/dashboard',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  coordinatorDashboard
);

// NEW: manual assign (even if no tech has accepted yet)
router.post(
  '/coordinator/bookings/:id/assign',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  coordinatorAssign
);

// NEW: reassign to a different technician
router.post(
  '/coordinator/bookings/:id/reassign',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  coordinatorReassign
);

// NEW: coordinator hard-delete (only early states)
router.delete(
  '/coordinator/bookings/:id',
  verifyToken, requireRole('coordinator', 'admin', 'super_admin'),
  coordinatorDelete
);

const {
  listTechniciansForCoordinator,
  candidatesForBooking,
} = require('../controllers/bookingController'); // or separate controller if you split it

const allowCoord = requireRole('coordinator','admin','super_admin');

router.get('/coordinator/technicians', verifyToken, allowCoord, listTechniciansForCoordinator);
router.get('/coordinator/technicians/candidates', verifyToken, allowCoord, candidatesForBooking);

module.exports = router;
