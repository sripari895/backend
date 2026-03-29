import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const STATUS_ENUM = [
  'Pending',
  'Dispatched',
  'In-Transit',
  'Out for Delivery',
  'Delivered',
];

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      index: true,
    },
    sender: {
      name: { type: String, required: [true, 'Sender name is required'] },
      address: { type: String, required: [true, 'Sender address is required'] },
      phone: { type: String, required: [true, 'Sender phone is required'] },
    },
    receiver: {
      name: { type: String, required: [true, 'Receiver name is required'] },
      address: { type: String, required: [true, 'Receiver address is required'] },
      phone: { type: String, required: [true, 'Receiver phone is required'] },
    },
    currentStatus: {
      type: String,
      enum: STATUS_ENUM,
      default: 'Pending',
    },
    statusHistory: [
      {
        status: { type: String, enum: STATUS_ENUM },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be at least 0.1 kg'],
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [1, 'Distance must be at least 1 km'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
  },
  { timestamps: true }
);

// Generate trackingId and initial status on creation
shipmentSchema.pre('save', function (next) {
  if (this.isNew) {
    this.trackingId = nanoid(10).toUpperCase();
    this.statusHistory.push({
      status: 'Pending',
      timestamp: new Date(),
      note: 'Shipment created',
    });
  }
  next();
});

// Price calculation helper
const calculatePrice = (weight, distance) => {
  const baseCost = weight * 10;
  let distanceFactor = 0;
  if (distance <= 50) distanceFactor = 30;
  else if (distance <= 200) distanceFactor = 60;
  else if (distance <= 500) distanceFactor = 100;
  else if (distance <= 1000) distanceFactor = 180;
  else distanceFactor = 250;
  return Math.round((baseCost + distanceFactor) * 100) / 100;
};

shipmentSchema.statics.STATUS_ENUM = STATUS_ENUM;
shipmentSchema.statics.calculatePrice = calculatePrice;

export default mongoose.model('Shipment', shipmentSchema);
