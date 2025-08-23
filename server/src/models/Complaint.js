const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  title: { type: String, required: true },
  details: { type: String, default: '' },
  status: { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
  assignedToRole: { type: String, enum: ['coordinator','admin','super_admin'], default: 'coordinator' },

  responses: [{
    byRole: { type: String, enum: ['customer','technician','coordinator','admin','super_admin'], required: true },
    // 👇 make byId optional (ObjectId or null)
    byId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // 👇 fallback display when responder has no ObjectId (e.g., env super_admin)
    byName: { type: String, default: null },
    text: { type: String, default: '' },
    at: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);