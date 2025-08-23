// models/Chat.js
const mongoose = require('mongoose');

const ChatConversationSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  participants: [
    {
      role: { type: String, enum: ['customer','technician','coordinator','admin','super_admin'], required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String } // 👈 snapshot of display name
    }
  ],
  topic: { type: String, default: '' }
}, { timestamps: true });

const ChatMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  senderRole: { type: String, enum: ['customer','technician','coordinator','admin','super_admin'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, default: '' },
  attachments: [{
    public_id: String,
    url: String
  }]
}, { timestamps: true });

module.exports = {
  ChatConversation: mongoose.model('ChatConversation', ChatConversationSchema),
  ChatMessage: mongoose.model('ChatMessage', ChatMessageSchema)
};
