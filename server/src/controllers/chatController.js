const mongoose = require('mongoose');
const { ChatConversation, ChatMessage } = require('../models/Chat');
const Booking = require('../models/Booking');

// Create (or reuse) a conversation for a booking.
// - After approval: customer + assigned technician can chat
// - Anytime: customer + coordinator/admin can chat with booking or general (booking=null)
exports.ensureConversation = async (req, res) => {
  try {
    const { bookingId, withRole, withUserId, topic = '' } = req.body || {};
    if (withRole && !['customer','technician','coordinator','admin','super_admin'].includes(withRole)) {
      return res.status(400).json({ message: 'Invalid withRole' });
    }
    if (!mongoose.isValidObjectId(withUserId)) {
      return res.status(400).json({ message: 'withUserId invalid' });
    }

    let booking = null;
    if (bookingId) {
      if (!mongoose.isValidObjectId(bookingId)) return res.status(400).json({ message: 'bookingId invalid' });
      booking = await Booking.findById(bookingId).lean();
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
    }

    // Participants = caller + target
    const key = {
      booking: booking ? booking._id : null,
      participants: [
        { role: req.user.role, userId: req.user.id },
        { role: withRole, userId: withUserId }
      ]
    };

    // Try to find an existing one with same participants & same booking
    const existing = await ChatConversation.findOne({
      booking: key.booking,
      'participants.role': { $all: [req.user.role, withRole] },
      'participants.userId': { $all: [req.user.id, withUserId] }
    });

    if (existing) return res.json(existing);

    const convo = await ChatConversation.create({
      booking: key.booking,
      participants: key.participants,
      topic
    });

    return res.status(201).json(convo);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// POST message
// body: { conversationId, text }
exports.postMessage = async (req, res) => {
  try {
    const { conversationId, text = '' } = req.body || {};
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'conversationId invalid' });
    }

    // Simple membership check
    const convo = await ChatConversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant = (convo.participants || [])
      .some(p => String(p.userId) === String(req.user.id) && p.role === req.user.role);
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const msg = await ChatMessage.create({
      conversation: conversationId,
      senderRole: req.user.role,
      senderId: req.user.id,
      text
    });

    // TODO: broadcast via websockets if you add Socket.IO later
    return res.status(201).json(msg);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// List messages
// GET /api/chat/messages?conversationId=...
exports.listMessages = async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'conversationId invalid' });
    }
    const convo = await ChatConversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant = (convo.participants || [])
      .some(p => String(p.userId) === String(req.user.id) && p.role === req.user.role);
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const msgs = await ChatMessage.find({ conversation: conversationId }).sort({ createdAt: 1 }).lean();
    return res.json(msgs);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
