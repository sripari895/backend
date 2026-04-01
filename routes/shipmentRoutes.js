const express = require('express');
const { protect, authorize, adminOnly } = require('../middleware/auth');
const {
  createShipment,
  getShipments,
  getStats,
  trackShipment,
  updateStatus,
  deleteShipment,
} = require('../controllers/shipmentController');

const router = express.Router();

router.post('/', protect, authorize('user'), createShipment);
router.get('/', protect, getShipments);
router.get('/stats/overview', protect, adminOnly, getStats);
router.get('/:trackingId', trackShipment);
router.patch('/:id/status', protect, adminOnly, updateStatus);
router.delete('/:id', protect, adminOnly, deleteShipment);

module.exports = router;