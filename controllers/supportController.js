const SupportTicket = require('../models/SupportTicket');

// POST /api/support — create a new ticket (logged-in user)
const createTicket = async (req, res, next) => {
  try {
    const { subject, category, trackingId, message } = req.body;

    const ticket = new SupportTicket({
      userId: req.user._id,
      subject,
      category,
      trackingId,
      message,
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/support/my — user sees own tickets
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
};

// GET /api/support/all — admin sees all tickets
const getAllTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/support/:id/status — admin updates ticket status
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!SupportTicket.STATUS_ENUM.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${SupportTicket.STATUS_ENUM.join(', ')}`,
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, message: `Status updated to ${status}`, data: ticket });
  } catch (error) {
    next(error);
  }
};

// POST /api/support/:id/reply — admin or ticket owner adds a reply
const replyToTicket = async (req, res, next) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.user.role !== 'admin' && ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this ticket' });
    }

    ticket.replies.push({
      user: req.user._id,
      message,
      isAdmin: req.user.role === 'admin',
    });

    if (req.user.role === 'admin' && ticket.status === 'Open') {
      ticket.status = 'In-Progress';
    }

    await ticket.save();

    res.json({ success: true, message: 'Reply added successfully', data: ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
};