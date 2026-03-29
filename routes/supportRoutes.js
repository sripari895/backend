import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
} from '../controllers/supportController.js';

const router = express.Router();

router.post('/', protect, createTicket);
router.get('/my', protect, getMyTickets);
router.get('/all', protect, adminOnly, getAllTickets);
router.patch('/:id/status', protect, adminOnly, updateTicketStatus);
router.post('/:id/reply', protect, replyToTicket);

export default router;
