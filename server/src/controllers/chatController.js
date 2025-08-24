const mongoose = require('mongoose');
const { ChatConversation, ChatMessage } = require('../models/Chat');
const Booking = require('../models/Booking');

// Helper: fetch display name for a role+id
async function getDisplayName(role, id) {
  try {
    if (!mongoose.isValidObjectId(id)) return '';
    if (role === 'customer') {
      const M = mongoose.model('Customer');
      const u = await M.findById(id).lean();
      return u?.full_name || u?.name || 'Customer';
    }
    if (role === 'technician') {
      const M = mongoose.model('Technician');
      const u = await M.findById(id).lean();
      return u?.full_name || 'Technician';
    }
    // coordinator/admin/super_admin
    const Admin = mongoose.model('Admin');
    const a = await Admin.findById(id).lean();
    return a?.full_name || (role === 'coordinator' ? 'Coordinator' : 'Admin');
  } catch {
    return '';
  }
}

async function ensureParticipantNames(convoDoc) {
  const convo = convoDoc.toObject ? convoDoc.toObject() : convoDoc; // works with lean or doc
  let changed = false;

  const parts = await Promise.all((convo.participants || []).map(async (p) => {
    if (p?.name && String(p.name).trim().length > 0) return p;
    const name = await getDisplayName(p.role, p.userId);
    if (!name) return p; // no change if lookup fails
    changed = true;
    return { ...p, name };
  }));

  if (changed) {
    await ChatConversation.updateOne({ _id: convo._id }, { $set: { participants: parts } });
    return { ...convo, participants: parts };
  }
  return convo;
}

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

    // Find existing with same pair + same booking
    const existing = await ChatConversation.findOne({
      booking: booking ? booking._id : null,
      $and: [
        { participants: { $elemMatch: { role: req.user.role, userId: req.user.id } } },
        { participants: { $elemMatch: { role: withRole, userId: withUserId } } }
      ]
    });

    if (existing) {
      const fixed = await ensureParticipantNames(existing);   // ✅ backfill names on old rows
      return res.json(fixed);
    }

    // Fresh conversation → snapshot both names
    const meName = await getDisplayName(req.user.role, req.user.id);
    const otherName = await getDisplayName(withRole, withUserId);

    const convo = await ChatConversation.create({
      booking: booking ? booking._id : null,
      participants: [
        { role: req.user.role, userId: req.user.id, name: meName },
        { role: withRole, userId: withUserId, name: otherName }
      ],
      topic
    });

    return res.status(201).json(convo);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// Send a message
exports.postMessage = async (req, res) => {
  try {
    const { conversationId, text = '' } = req.body || {};
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'conversationId invalid' });
    }

    const convo = await ChatConversation.findById(conversationId);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });

    const staffRoles = ['admin','super_admin','coordinator'];
    const isStaff = staffRoles.includes(req.user.role);

    let isParticipant = (convo.participants || [])
      .some(p => String(p.userId) === String(req.user.id) && p.role === req.user.role);

    // Auto-join staff on first send
    if (!isParticipant && isStaff) {
      const name = await getDisplayName(req.user.role, req.user.id);
      convo.participants.push({ role: req.user.role, userId: req.user.id, name });
      await convo.save();
      isParticipant = true;
    }
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    const msg = await ChatMessage.create({
      conversation: conversationId,
      senderRole: req.user.role,
      senderId: req.user.id,
      text
    });

    // Keep convo bumped
    await ChatConversation.updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } });

    return res.status(201).json(msg);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// List messages
exports.listMessages = async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'conversationId invalid' });
    }

    const convo = await ChatConversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });

    const staffRoles = ['admin', 'super_admin', 'coordinator'];
    const isStaff = staffRoles.includes(req.user.role);

    const isParticipant = (convo.participants || [])
      .some(p => String(p.userId) === String(req.user.id) && p.role === req.user.role);

    if (!isParticipant && !isStaff) return res.status(403).json({ message: 'Forbidden' });

    const msgs = await ChatMessage.find({ conversation: conversationId }).sort({ createdAt: 1 }).lean();
    return res.json(msgs);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// List conversations I can see
// List conversations I can see
exports.listConversations = async (req, res) => {
  try {
    const { bookingId } = req.query;

    const staffRoles = ['admin','super_admin','coordinator'];
    const isStaff = staffRoles.includes(req.user.role);

    let q = {};
    if (bookingId) q.booking = bookingId;

    if (!isStaff) {
      q = {
        ...q,
        $and: [{ participants: { $elemMatch: { role: req.user.role, userId: req.user.id } } }]
      };
    }

    const raw = await ChatConversation
      .find(q)
      .sort({ updatedAt: -1 })
      .populate({ path: 'booking', select: 'problemTitle _id' });

    // ✅ Ensure names exist for every participant before returning
    const convos = [];
    for (const c of raw) {
      const fixed = await ensureParticipantNames(c);
      convos.push(fixed);
    }

    res.json(convos);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};