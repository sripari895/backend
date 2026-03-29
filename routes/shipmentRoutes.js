import express from 'express';
import { protect, authorize, adminOnly } from '../middleware/auth.js';
import {
  createShipment,
  getShipments,
  getStats,
  trackShipment,
  updateStatus,
  deleteShipment,
} from '../controllers/shipmentController.js';

const router = express.Router();

router.post('/', protect, authorize('user'), createShipment);
router.get('/', protect, getShipments);
router.get('/stats/overview', protect, adminOnly, getStats);
router.get('/:trackingId', trackShipment);
router.patch('/:id/status', protect, adminOnly, updateStatus);
router.delete('/:id', protect, adminOnly, deleteShipment);

export default router;
