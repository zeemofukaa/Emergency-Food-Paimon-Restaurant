const express = require('express');
const router  = express.Router();
const Reservation  = require('../models/Reservation');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/reservations — create booking
router.post('/', async (req, res) => {
  try {
    const { name, date, time, guests, note } = req.body;

    if (!name || !date || !time || !guests) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    // prevent booking in the past
    const bookingDate = new Date(`${date}T${time}`);
    if (bookingDate < new Date()) {
      return res.status(400).json({ error: 'Cannot book a table in the past' });
    }

    const reservation = await Reservation.create({
      userId: req.user.userId,
      name, date, time,
      guests: parseInt(guests),
      note: note || '',
    });

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// GET /api/reservations — user's bookings
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.userId })
      .sort({ date: 1, time: 1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// DELETE /api/reservations/:id — cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found'
      });
    }

    res.json({
      message: 'Reservation cancelled'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to cancel reservation'
    });
  }
});

module.exports = router;