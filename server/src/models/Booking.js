const mongoose = require('mongoose');

const BookingMediaSchema = new mongoose.Schema({
  public_id: { type: String, default: null },
  url: { type: String, default: null }
}, { _id: false });

const TechnicianResponseSchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  status: { type: String, enum: ['accepted', 'declined'], required: true },
  respondedAt: { type: Date, default: Date.now }
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  // Who & what
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  service:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

  // Snapshot of customer data for this booking (do NOT write back to Customer)
  customerSnapshot: {
    full_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true }
  },

  // Booking details
  preferredAt: { type: Date, required: true },  // combined date+time
  timeSlot: { type: String, default: null },     // optional label
  serviceCategory: { type: String, default: null }, // snapshot from Service.category
  brandModel: { type: String, default: '' },
  equipmentAge: { type: String, default: '' },

  problemTitle: { type: String, required: true },   // short title
  problemDescription: { type: String, default: '' },// long text
  specialInstructions: { type: String, default: '' },

  media: [BookingMediaSchema], // images stored in Cloudinary

  // Workflow
  status: {
    type: String,
    enum: [
      'pending',              // created by customer
      'awaiting_coordinator', // at least one tech accepted
      'coordinator_approved', // approved & assigned
      'completed',
      'cancelled'
    ],
    default: 'pending'
  },

  technicianResponses: [TechnicianResponseSchema], // per-tech accept/decline
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null }
}, { timestamps: true });

BookingSchema.index({ 'customerSnapshot.district': 1, status: 1, createdAt: -1 });
BookingSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', BookingSchema);
