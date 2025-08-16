const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');

// Guard: ensure the technician is assigned to this booking
async function ensureAssigned(bookingId, techId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) return [null, 'Booking not found'];
  if (!booking.assignedTechnician || String(booking.assignedTechnician) !== String(techId)) {
    return [null, 'Forbidden: not assigned to this booking'];
  }
  return [booking, null];
}

// PATCH /api/technician/bookings/:id/status   body: { onTheWay?, arrived?, started? }
exports.updateLiveStatus = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const [booking, err] = await ensureAssigned(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ message: err });

    const { onTheWay, arrived, started } = req.body || {};
    const now = new Date();

    if (onTheWay === true && !booking.techOnTheWayAt) booking.techOnTheWayAt = now;
    if (arrived === true && !booking.techArrivedAt) {
      booking.techArrivedAt = now;
      // When arrived, consider job in progress
      booking.status = 'in_progress';
    }
    if (started === true && !booking.workStartedAt) {
      booking.workStartedAt = now;
      booking.status = 'in_progress';
    }

    await booking.save();
    return res.json({ message: 'Status updated', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// POST /api/technician/bookings/:id/expenses  (form-data: label, amount, attachments[])
exports.addExpenses = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const [booking, err] = await ensureAssigned(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ message: err });

    const { label, amount } = req.body;
    if (!label || amount === undefined) {
      return res.status(400).json({ message: 'label and amount are required' });
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      return res.status(400).json({ message: 'amount must be a non-negative number' });
    }

    const attachments = (req.files || []).map(f => ({ public_id: f.filename || null, url: f.path || null }))
                                          .filter(a => !!a.url);

    booking.expenses.push({ label, amount: amt, attachments });
    await booking.save();

    return res.status(201).json({ message: 'Expense added', bookingId: booking._id, expenses: booking.expenses });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// PATCH /api/technician/bookings/:id/notes  body: { notes }
exports.updateNotes = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const [booking, err] = await ensureAssigned(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ message: err });

    booking.notes = String(req.body?.notes || '');
    await booking.save();
    return res.json({ message: 'Notes updated', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// POST /api/technician/bookings/:id/complete   body: { serviceCharge, paymentMethod }
exports.completeAndConfirmPayment = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const [booking, err] = await ensureAssigned(req.params.id, req.user.id);
    if (!booking) return res.status(404).json({ message: err });

    const serviceCharge = Number(req.body?.serviceCharge || 0);
    const method = String(req.body?.paymentMethod || 'cash').toLowerCase();
    if (!['cash','card'].includes(method)) {
      return res.status(400).json({ message: 'paymentMethod must be cash or card' });
    }
    if (Number.isNaN(serviceCharge) || serviceCharge < 0) {
      return res.status(400).json({ message: 'serviceCharge must be a non-negative number' });
    }

    // compute totals
    const expensesTotal = (booking.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const grandTotal = serviceCharge + expensesTotal;

    // mark timeline and payment
    const now = new Date();
    if (!booking.workStartedAt) booking.workStartedAt = now; // safety
    booking.workCompletedAt = now;
    booking.status = 'completed';
    booking.payment = {
      method,
      serviceCharge,
      expensesTotal,
      grandTotal,
      currency: 'LKR',
      confirmedByTechnicianAt: now,
      receiptNumber: `FM-${now.getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`
    };

    await booking.save();

    // TODO: notify customer & coordinator/admin via email/SMS/WS in your notification layer

    return res.json({
      message: 'Job completed & payment confirmed',
      bookingId: booking._id,
      payment: booking.payment
    });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
