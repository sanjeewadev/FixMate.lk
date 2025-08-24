const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const {listConversations, ensureConversation, postMessage, listMessages } = require('../controllers/chatController');

router.get('/chat/conversations', verifyToken, listConversations); 
// Create or reuse a conversation (booking or general)
router.post('/chat/conversations', verifyToken, ensureConversation);

// Send a message
router.post('/chat/messages', verifyToken, postMessage);

// List messages in a conversation
router.get('/chat/messages', verifyToken, listMessages);

module.exports = router;