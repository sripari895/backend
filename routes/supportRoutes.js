const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
} = require('../controllers/supportController');

const router = express.Router();

router.post('/', protect, createTicket);
router.get('/my', protect, getMyTickets);
router.get('/all', protect, adminOnly, getAllTickets);
router.patch('/:id/status', protect, adminOnly, updateTicketStatus);
router.post('/:id/reply', protect, replyToTicket);

module.exports = router;