const Shipment = require('../models/Shipment');


// 📌 POST /api/shipments — create shipment
const createShipment = async (req, res, next) => {
  try {
    const { sender, receiver, weight, distance } = req.body;

    // ✅ Basic validation
    if (!sender || !receiver || !weight || !distance) {
      return res.status(400).json({
        success: false,
        message: 'Sender, receiver, weight, and distance are required',
      });
    }

    // ✅ Use model helper (avoid duplicate logic)
    const price = Shipment.calculatePrice(weight, distance);

    const shipment = await Shipment.create({
      sender,
      receiver,
      weight,
      distance,
      price,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: shipment,
    });

  } catch (error) {
    console.error('❌ Create Shipment Error:', error.message);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};


// 📌 GET /api/shipments — role-based fetch
const getShipments = async (req, res, next) => {
  try {
    const { search } = req.query;
    let filter = {};

    // 👤 User → only own shipments
    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    }

    // 🔍 Search by trackingId
    if (search && search.trim()) {
      filter.trackingId = { $regex: search.trim(), $options: 'i' };
    }

    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json({
      success: true,
      count: shipments.length,
      data: shipments,
    });

  } catch (error) {
    console.error('❌ Get Shipments Error:', error.message);
    next(error);
  }
};


// 📊 GET /api/shipments/stats/overview — admin only
const getStats = async (req, res, next) => {
  try {
    const stats = await Shipment.aggregate([
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to readable format
    const formatted = {
      total: 0,
      pending: 0,
      dispatched: 0,
      inTransit: 0,
      outForDelivery: 0,
      delivered: 0,
    };

    stats.forEach((item) => {
      formatted.total += item.count;

      switch (item._id) {
        case 'Pending':
          formatted.pending = item.count;
          break;
        case 'Dispatched':
          formatted.dispatched = item.count;
          break;
        case 'In-Transit':
          formatted.inTransit = item.count;
          break;
        case 'Out for Delivery':
          formatted.outForDelivery = item.count;
          break;
        case 'Delivered':
          formatted.delivered = item.count;
          break;
      }
    });

    res.json({
      success: true,
      data: formatted,
    });

  } catch (error) {
    console.error('❌ Stats Error:', error.message);
    next(error);
  }
};


// 📦 GET /api/shipments/:trackingId — public tracking
const trackShipment = async (req, res, next) => {
  try {
    const trackingId = req.params.trackingId?.toUpperCase();

    const shipment = await Shipment.findOne({ trackingId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    res.json({
      success: true,
      data: shipment,
    });

  } catch (error) {
    console.error('❌ Track Shipment Error:', error.message);
    next(error);
  }
};


// 🔄 PATCH /api/shipments/:id/status — admin only
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // ❌ Invalid status
    if (!Shipment.STATUS_ENUM.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${Shipment.STATUS_ENUM.join(', ')}`,
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    // ✅ Update
    shipment.currentStatus = status;
    shipment.statusHistory.push({
      status,
      timestamp: new Date(),
      note: `Updated to ${status}`,
    });

    await shipment.save();

    res.json({
      success: true,
      message: `Status updated to "${status}"`,
      data: shipment,
    });

  } catch (error) {
    console.error('❌ Update Status Error:', error.message);
    next(error);
  }
};


// ❌ DELETE /api/shipments/:id — admin only
const deleteShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found',
      });
    }

    res.json({
      success: true,
      message: 'Shipment deleted successfully',
    });

  } catch (error) {
    console.error('❌ Delete Shipment Error:', error.message);
    next(error);
  }
};


// 📦 Export
module.exports = {
  createShipment,
  getShipments,
  getStats,
  trackShipment,
  updateStatus,
  deleteShipment,
};