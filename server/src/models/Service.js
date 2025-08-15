const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    basePrice:   { type: Number, default: 0 },
    category:    { type: String, default: 'General', index: true },

    // <-- IMPORTANT: images saved as "serviceImages"
    // Each entry is { public_id, url }
    serviceImages: [
      {
        public_id: { type: String, default: null },
        url:       { type: String, default: null }
      }
    ],

    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
  },
  { timestamps: true }
);

// text index for search
ServiceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);
