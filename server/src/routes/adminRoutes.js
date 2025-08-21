// routes/adminRoutes.js
const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const getUploadMiddleware = require('../middleware/cloudinaryUploader');

// Profile image folder: fixmate/profiles/admins
const uploadAdminAvatar = getUploadMiddleware('profiles/admins');

const AdminAuth = require('../controllers/adminController');
const AdminCustomers = require('../controllers/adminCustomersController');
const AdminCoordinators = require('../controllers/adminCoordinatorsController');
const AdminTechnicians = require('../controllers/adminTechniciansController');
const AdminAdmins = require('../controllers/adminAdminsController');

// ---------- Auth ----------
router.post('/admin/register', uploadAdminAvatar.single('profile_image'), AdminAuth.registerAdmin);
router.post('/admin/login', AdminAuth.loginAdmin);

// ---------- My Profile ----------
router.get('/admin/me', verifyToken, requireRole('admin','super_admin'), AdminAuth.getMyProfile);
router.patch('/admin/me', verifyToken, requireRole('admin'), AdminAuth.updateMyProfile);
router.patch('/admin/me/password', verifyToken, requireRole('admin','super_admin'), AdminAuth.changeMyPassword);
router.post('/admin/me/avatar', verifyToken, requireRole('admin'), uploadAdminAvatar.single('profile_image'), AdminAuth.changeMyProfileImage);

// ---------- Customers (admin/super_admin) ----------
router.get('/customers', verifyToken, requireRole('admin','super_admin'), AdminCustomers.listCustomers);
router.post('/customers', verifyToken, requireRole('admin','super_admin'), AdminCustomers.createCustomer);
router.put('/customers/:id', verifyToken, requireRole('admin','super_admin'), AdminCustomers.updateCustomer);
router.delete('/customers/:id', verifyToken, requireRole('admin','super_admin'), AdminCustomers.deleteCustomer);

// ---------- Coordinators (only admins / super_admin) ----------
router.get('/coordinators', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.listCoordinators);
router.post('/coordinators', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.createCoordinator);
router.put('/coordinators/:id', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.updateCoordinator);
router.delete('/coordinators/:id', verifyToken, requireRole('admin','super_admin'), AdminCoordinators.deleteCoordinator);

// ---------- Technicians (admin/super_admin) ----------
router.get('/technicians', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.listTechnicians);
router.post('/technicians', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.createTechnician);
router.put('/technicians/:id', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.updateTechnician);
router.delete('/technicians/:id', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.deleteTechnician);

// Become Technician applications
router.get('/admin/technician-apps', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.listTechApplications);
router.post('/admin/technician-apps/:id/convert', verifyToken, requireRole('admin','super_admin'), AdminTechnicians.convertApplicationToTechnician);

// ---------- Admins (list/create/edit by admin/super_admin; delete only super_admin) ----------
router.get('/admin/admins', verifyToken, requireRole('admin','super_admin'), AdminAdmins.listAdmins);
router.post('/admin/admins', verifyToken, requireRole('admin','super_admin'), AdminAdmins.createAdmin);
router.put('/admin/admins/:id', verifyToken, requireRole('admin','super_admin'), AdminAdmins.updateAdmin);
router.delete('/admin/admins/:id', verifyToken, requireRole('super_admin'), AdminAdmins.deleteAdmin);

module.exports = router;
