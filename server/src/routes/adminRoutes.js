// routes/adminRoutes.js
const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const getUploadMiddleware = require('../middleware/cloudinaryUploader');

const uploadAdminAvatar = getUploadMiddleware('profiles/admins');
const uploadServiceImages = getUploadMiddleware('services');

const AdminAuth = require('../controllers/adminController');
const AdminCustomers = require('../controllers/adminCustomersController');
const AdminCoordinators = require('../controllers/adminCoordinatorsController');
const AdminTechnicians = require('../controllers/adminTechniciansController');
const AdminAdmins = require('../controllers/adminAdminsController');
const ServiceController = require('../controllers/serviceController');

/**
 * Mount this file as:
 *   app.use('/api/admin', router)
 */

// ---------- Auth (canonical) ----------
router.post('/login', AdminAuth.loginAdmin);
router.post('/register', uploadAdminAvatar.single('profile_image'), AdminAuth.registerAdmin);

// ---------- Auth (aliases for older frontends) ----------
router.post('/admin/login', AdminAuth.loginAdmin);
router.post('/admin/register', uploadAdminAvatar.single('profile_image'), AdminAuth.registerAdmin);

// ---------- My Profile ----------
router.get('/me', verifyToken, requireRole('admin','super_admin'), AdminAuth.getMyProfile);
router.patch('/me', verifyToken, requireRole('admin'), AdminAuth.updateMyProfile);
router.patch('/me/password', verifyToken, requireRole('admin','super_admin'), AdminAuth.changeMyPassword);
router.post('/me/avatar', verifyToken, requireRole('admin'), uploadAdminAvatar.single('profile_image'), AdminAuth.changeMyProfileImage);

// ---------- Customers ----------
router.get('/customers', verifyToken, requireRole('admin','super_admin'), AdminCustomers.listCustomers);
router.post('/customers', verifyToken, requireRole('admin','super_admin'), AdminCustomers.createCustomer);
router.put('/customers/:id', verifyToken, requireRole('admin','super_admin'), AdminCustomers.updateCustomer);
router.delete('/customers/:id', verifyToken, requireRole('admin','super_admin'), AdminCustomers.deleteCustomer);

// ---------- Coordinators ----------
router.get('/coordinators', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.listCoordinators);
router.post('/coordinators', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.createCoordinator);
router.put('/coordinators/:id', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.updateCoordinator);
router.delete('/coordinators/:id', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.deleteCoordinator);

// ---------- Technicians ----------
router.get('/technicians', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.listTechnicians);
router.post('/technicians', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.createTechnician);
router.put('/technicians/:id', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.updateTechnician);
router.delete('/technicians/:id', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.deleteTechnician);

// Technician apps (canonical)
router.get('/technicians/applications', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.listTechApplications);
router.post('/technicians/convert/:id', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.convertApplicationToTechnician);
// Technician apps (aliases)
router.get('/admin/technician-apps', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.listTechApplications);
router.post('/admin/technician-apps/:id/convert', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.convertApplicationToTechnician);

// ---------- Admins ----------
router.get('/admins', verifyToken, requireRole('admin','super_admin'), AdminAdmins.listAdmins);
router.post('/admins', verifyToken, requireRole('admin','super_admin'), AdminAdmins.createAdmin);
router.put('/admins/:id', verifyToken, requireRole('admin','super_admin'), AdminAdmins.updateAdmin);
router.delete('/admins/:id', verifyToken, requireRole('super_admin'), AdminAdmins.deleteAdmin);

// ---------- Services ----------
//router.get('/services', verifyToken, requireRole('admin','super_admin'), ServiceController.adminListServices);
//router.post('/services', verifyToken, requireRole('admin','super_admin'), uploadServiceImages.array('images', 6), ServiceController.createService);
//router.put('/services/:id', verifyToken, requireRole('admin','super_admin'), uploadServiceImages.array('images', 6), ServiceController.updateService);
//router.patch('/services/:id', verifyToken, requireRole('admin','super_admin'), ServiceController.updateService);
//router.patch('/services/:id/activate', verifyToken, requireRole('admin','super_admin'), ServiceController.activateService);
//router.delete('/services/:id', verifyToken, requireRole('admin','super_admin'), ServiceController.deleteService);

module.exports = router;
