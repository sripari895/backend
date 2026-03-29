import mongoose from 'mongoose';

const CATEGORY_ENUM = ['Delay', 'Damage', 'Billing', 'Other'];
const STATUS_ENUM = ['Open', 'In-Progress', 'Resolved'];

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORY_ENUM,
      required: [true, 'Category is required'],
    },
    trackingId: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    status: {
      type: String,
      enum: STATUS_ENUM,
      default: 'Open',
    },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

supportTicketSchema.statics.STATUS_ENUM = STATUS_ENUM;
supportTicketSchema.statics.CATEGORY_ENUM = CATEGORY_ENUM;

export default mongoose.model('SupportTicket', supportTicketSchema);
