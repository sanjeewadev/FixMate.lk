// src/routes/aiRoutes.js
const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const { ingest, chat } = require('../controllers/aiController');

// Admin-only knowledge ingest
router.post('/ai/ingest', verifyToken, requireRole('admin','super_admin'), ingest);

// Public chat (you can lock with verifyToken if you want)
router.post('/ai/chat', chat);

module.exports = router;