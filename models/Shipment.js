const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

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
      enum: {
        values: STATUS_ENUM,
        message: 'Invalid shipment status',
      },
      default: 'Pending',
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: {
            values: STATUS_ENUM,
            message: 'Invalid history status',
          },
        },
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


// 📦 Price calculation helper
const calculatePrice = (weight, distance) => {
  try {
    if (!weight || !distance) {
      throw new Error('Weight and distance required for price calculation');
    }

    const baseCost = weight * 10;

    let distanceFactor = 0;
    if (distance <= 50) distanceFactor = 30;
    else if (distance <= 200) distanceFactor = 60;
    else if (distance <= 500) distanceFactor = 100;
    else if (distance <= 1000) distanceFactor = 180;
    else distanceFactor = 250;

    return Math.round((baseCost + distanceFactor) * 100) / 100;
  } catch (error) {
    console.error('❌ Price Calculation Error:', error.message);
    throw error;
  }
};


// 🚚 Pre-save hook
shipmentSchema.pre('save', function (next) {
  try {
    if (this.isNew) {
      this.trackingId = nanoid(10).toUpperCase();

      this.statusHistory.push({
        status: 'Pending',
        timestamp: new Date(),
        note: 'Shipment created',
      });

      if (!this.price) {
        this.price = calculatePrice(this.weight, this.distance);
      }
    }

    next();
  } catch (error) {
    console.error('❌ Pre-save Error:', error.message);
    next(error);
  }
});


// 🚫 Handle duplicate trackingId cleanly
shipmentSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    next(new Error('Tracking ID already exists. Try again.'));
  } else if (error.name === 'ValidationError') {
    next(new Error(error.message));
  } else {
    next(error);
  }
});


// 📊 Expose helpers
shipmentSchema.statics.STATUS_ENUM = STATUS_ENUM;
shipmentSchema.statics.calculatePrice = calculatePrice;


// ✅ Safe export
module.exports = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);