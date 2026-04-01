const mongoose = require('mongoose');

const STATUS_ENUM = ['Open', 'In-Progress', 'Resolved', 'Closed'];

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Reply message is required'],
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },

    category: {
      type: String,
      enum: ['Delivery Issue', 'Payment', 'Tracking', 'Other'],
      default: 'Other',
    },

    trackingId: {
      type: String,
      trim: true,
      default: null,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: STATUS_ENUM,
        message: 'Invalid ticket status',
      },
      default: 'Open',
    },

    replies: [replySchema],
  },
  { timestamps: true }
);

// 📊 Expose status enum
supportTicketSchema.statics.STATUS_ENUM = STATUS_ENUM;

// ✅ Safe export
module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);