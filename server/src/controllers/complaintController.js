const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

exports.createComplaint = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { bookingId = null, title, details = '' } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title is required' });

    const data = {
      booking: bookingId && mongoose.isValidObjectId(bookingId) ? bookingId : null,
      customer: req.user.id,
      title,
      details,
      status: 'open',
      assignedToRole: 'coordinator'
    };
    const doc = await Complaint.create(data);
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// List my complaints
exports.listMyComplaints = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const items = await Complaint.find({ customer: req.user.id }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// Staff/Admin view
exports.listAllComplaints = async (_req, res) => {
  try {
    const items = await Complaint.find({}).sort({ createdAt: -1 });
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// Respond / change status (staff/admin)
exports.respondComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { text = '', status } = req.body || {};
    const c = await Complaint.findById(id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });

    const isObjId = mongoose.isValidObjectId(req.user?.id);

    const response = {
      byRole: req.user.role,
      text,
      at: new Date()
    };

    if (isObjId) {
      response.byId = req.user.id;            // normal users with real ObjectId
    } else {
      response.byName = 'Super Admin';  // env-based super_admin
    }

    c.responses.push(response);

    if (status && ['open','in_progress','resolved','closed'].includes(status)) {
      c.status = status;
    }

    await c.save();
    return res.json({ message: 'Updated', complaint: c });

  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
