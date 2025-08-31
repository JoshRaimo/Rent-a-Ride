const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Chat room identifier
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Chat type: 'support', 'general', 'booking'
  type: {
    type: String,
    enum: ['support', 'general', 'booking'],
    required: true
  },
  
  // Participants (user IDs)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // For booking-specific chats
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Chat metadata
  title: String,
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
chatSchema.index({ participants: 1, type: 1 });
chatSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Chat', chatSchema);
