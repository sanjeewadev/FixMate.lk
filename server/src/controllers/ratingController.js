const mongoose = require('mongoose');
const Booking = require('../models/Booking');

exports.rateTechnician = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const { stars, comment = '' } = req.body || {};
    const rating = Number(stars);

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.customer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (booking.status !== 'completed') {
      return res.status(409).json({ message: 'You can rate only after completion' });
    }
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'stars must be 1..5' });
    }

    booking.rating = { stars: rating, comment, createdAt: new Date() };
    await booking.save();

    return res.json({ message: 'Thank you for rating!', rating: booking.rating });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};
