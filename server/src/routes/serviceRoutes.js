const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const getUploadMiddleware = require('../middleware/cloudinaryUploader'); // your dynamic uploader
const uploadServiceImages = getUploadMiddleware('services'); // folder: fixmate/services

const {
  createService,
  listServices,
  getServiceBySlug,
  updateService,
  deleteService,
  adminListServices,
  activateService
} = require('../controllers/serviceController');

// -------- Public --------
router.get('/services', listServices);
router.get('/services/:slug', getServiceBySlug);
//
//// -------- Admin-only --------
//// Use .array('images') to accept multiple files (field name MUST be "images")
//router.post(
//  '/admin/services',
//  verifyToken,
//  requireRole('admin','super_admin'),
//  uploadServiceImages.array('images', 6), // allow up to 6 images; adjust as needed
//  createService
//);
//
//router.put(
//  '/admin/services/:id',
//  verifyToken,
//  requireRole('admin','super_admin'),
//  uploadServiceImages.array('images', 6),
//  updateService
//);
//
//router.delete(
//  '/admin/services/:id',
//  verifyToken,
//  requireRole('admin','super_admin'),
//  deleteService
//);

// ---------- Services ----------
router.get('/admin/services', verifyToken, requireRole('admin','super_admin'), adminListServices);
router.post('/admin/services', verifyToken, requireRole('admin','super_admin'), uploadServiceImages.array('images', 6), createService);
router.put('/admin/services/:id', verifyToken, requireRole('admin','super_admin'), uploadServiceImages.array('images', 6), updateService);
router.patch('/admin/services/:id', verifyToken, requireRole('admin','super_admin'), updateService);
router.patch('/admin/services/:id/activate', verifyToken, requireRole('admin','super_admin'), activateService);
router.delete('/admin/services/:id', verifyToken, requireRole('admin','super_admin'), deleteService);

module.exports = router;
