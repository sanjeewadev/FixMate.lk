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

const ExpenseSchema = new mongoose.Schema({
  label: { type: String, required: true },          // "Capacitor", "Transport"
  amount: { type: Number, required: true, min: 0 },
  attachments: [BookingMediaSchema]
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['cash', 'card'], default: 'cash' },
  serviceCharge: { type: Number, default: 0 },       // technician enters or system-calculated
  expensesTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'LKR' },
  confirmedByTechnicianAt: { type: Date, default: null },
  receiptNumber: { type: String, default: null }     // e.g., "FM-2025-000123"
}, { _id: false });

const RatingSchema = new mongoose.Schema({
  stars: { type: Number, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  // Who & what
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  service:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

  customerSnapshot: {
    full_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true }
  },

  // Details
  preferredAt: { type: Date, required: true },
  timeSlot: { type: String, default: null },
  serviceCategory: { type: String, default: null },
  brandModel: { type: String, default: '' },
  equipmentAge: { type: String, default: '' },
  problemTitle: { type: String, required: true },
  problemDescription: { type: String, default: '' },
  specialInstructions: { type: String, default: '' },
  media: [BookingMediaSchema],

  // Workflow status
  status: {
    type: String,
    enum: [
      'pending',              // created by customer
      'awaiting_coordinator', // at least one tech accepted
      'coordinator_approved', // assigned to technician
      'in_progress',          // tech on site / working
      'completed',            // payment confirmed
      'cancelled'
    ],
    default: 'pending'
  },

  // Timeline (technician updates)
  techOnTheWayAt: { type: Date, default: null },
  techArrivedAt: { type: Date, default: null },
  workStartedAt: { type: Date, default: null },
  workCompletedAt: { type: Date, default: null },

  // Job extras
  expenses: [ExpenseSchema],
  notes: { type: String, default: '' },              // technician job notes
  payment: PaymentSchema,

  // Rating by customer (after completion)
  rating: RatingSchema,

  technicianResponses: [TechnicianResponseSchema],
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },

  // Optional cancellation audit (you planned this later; harmless to keep)
  cancelledAt: { type: Date, default: null },
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

BookingSchema.index({ 'customerSnapshot.district': 1, status: 1, createdAt: -1 });
BookingSchema.index({ customer: 1, createdAt: -1 });
BookingSchema.index({ 'payment.receiptNumber': 1 }, { sparse: true });
BookingSchema.index({ status: 1, "payment.confirmedByTechnicianAt": -1 });
BookingSchema.index({ service: 1, "payment.confirmedByTechnicianAt": -1 });
BookingSchema.index({ assignedTechnician: 1, "payment.confirmedByTechnicianAt": -1 });
BookingSchema.index({ "customerSnapshot.district": 1, "payment.confirmedByTechnicianAt": -1 });
// In Booking schema file, add:
BookingSchema.index({ 'technicianResponses.status': 1, 'technicianResponses.respondedAt': 1 });
BookingSchema.index({ 'technicianResponses.technician': 1, 'technicianResponses.status': 1 });
BookingSchema.index({ assignedTechnician: 1, status: 1 });



module.exports = mongoose.model('Booking', BookingSchema);
