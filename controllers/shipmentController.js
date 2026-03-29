import Shipment from '../models/Shipment.js';

// POST /api/shipments — create a new shipment (user only)
export const createShipment = async (req, res, next) => {
  try {
    const { sender, receiver, weight, distance } = req.body;

    const baseCost = weight * 10;
    let distanceFactor = 0;
    if (distance <= 50) distanceFactor = 30;
    else if (distance <= 200) distanceFactor = 60;
    else if (distance <= 500) distanceFactor = 100;
    else if (distance <= 1000) distanceFactor = 180;
    else distanceFactor = 250;
    const finalPrice = Math.round((baseCost + distanceFactor) * 100) / 100;

    const shipment = new Shipment({
      sender,
      receiver,
      weight,
      distance,
      price: finalPrice,
      userId: req.user._id,
    });
    await shipment.save();

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/shipments — role-based: users see own, admin sees all
export const getShipments = async (req, res, next) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    }

    if (search && search.trim()) {
      filter.trackingId = { $regex: search.trim(), $options: 'i' };
    }

    const shipments = await Shipment.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (error) {
    next(error);
  }
};

// GET /api/shipments/stats/overview — admin only
export const getStats = async (req, res, next) => {
  try {
    const total = await Shipment.countDocuments();
    const pending = await Shipment.countDocuments({ currentStatus: 'Pending' });
    const dispatched = await Shipment.countDocuments({ currentStatus: 'Dispatched' });
    const inTransit = await Shipment.countDocuments({ currentStatus: 'In-Transit' });
    const outForDelivery = await Shipment.countDocuments({ currentStatus: 'Out for Delivery' });
    const delivered = await Shipment.countDocuments({ currentStatus: 'Delivered' });

    res.json({
      success: true,
      data: { total, pending, dispatched, inTransit, outForDelivery, delivered },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/shipments/:trackingId — public tracking lookup
export const trackShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findOne({
      trackingId: req.params.trackingId.toUpperCase(),
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/shipments/:id/status — admin only
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!Shipment.STATUS_ENUM.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Shipment.STATUS_ENUM.join(', ')}`,
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    shipment.currentStatus = status;
    shipment.statusHistory.push({
      status,
      timestamp: new Date(),
      note: `Status updated to ${status}`,
    });

    await shipment.save();

    res.json({
      success: true,
      message: `Status updated to "${status}"`,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/shipments/:id — admin only
export const deleteShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
