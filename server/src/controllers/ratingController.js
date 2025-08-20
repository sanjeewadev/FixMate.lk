const mongoose = require('mongoose');
const Booking = require('../models/Booking');

/**
 * CUSTOMER: rate a completed booking
 * POST /api/bookings/:id/rate
 * body: { stars: 1..5, comment?: string }
 */
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

/**
 * STAFF/ADMIN: list ratings/feedback (with filters & pagination)
 * GET /api/ratings?technicianId=&minStars=&maxStars=&q=&page=&limit=&from=&to=
 */
exports.listRatingsForStaff = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!['coordinator', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const {
      technicianId,
      minStars = 1,
      maxStars = 5,
      q,
      page = 1,
      limit = 20,
      from,
      to,
    } = req.query || {};

    const find = {
      'rating.stars': { $exists: true, $gte: Number(minStars), $lte: Number(maxStars) },
    };

    if (technicianId && mongoose.isValidObjectId(technicianId)) {
      find.assignedTechnician = technicianId;
    }

    if (from || to) {
      find['rating.createdAt'] = {};
      if (from) find['rating.createdAt'].$gte = new Date(from);
      if (to)   find['rating.createdAt'].$lte = new Date(to);
    }

    if (q && String(q).trim()) {
      const rx = { $regex: String(q).trim(), $options: 'i' };
      find.$or = [{ 'rating.comment': rx }, { problemTitle: rx }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Booking.find(find)
        .select('service problemTitle rating assignedTechnician customer preferredAt')
        .populate('service', 'name category')
        .populate('assignedTechnician', 'full_name email phone_number district specialization profile_image_url')
        .populate('customer', 'full_name email')
        .sort({ 'rating.createdAt': -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(find),
    ]);

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items: items.map((b) => ({
        bookingId: b._id,
        service: b.service
          ? { id: b.service._id, name: b.service.name, category: b.service.category }
          : null,
        problemTitle: b.problemTitle,
        ratedAt: b.rating?.createdAt,
        rating: { stars: b.rating?.stars, comment: b.rating?.comment },
        technician: b.assignedTechnician
          ? {
              id: b.assignedTechnician._id,
              name: b.assignedTechnician.full_name,
              email: b.assignedTechnician.email,
              phone: b.assignedTechnician.phone_number,
              district: b.assignedTechnician.district,
              specialization: b.assignedTechnician.specialization,
              profile_image_url: b.assignedTechnician.profile_image_url,
            }
          : null,
        customer: b.customer
          ? { id: b.customer._id, name: b.customer.full_name, email: b.customer.email }
          : null,
        preferredAt: b.preferredAt,
      })),
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * STAFF/ADMIN: single technician rating summary (avg, count, distribution)
 * GET /api/technicians/:id/ratings/summary
 */
exports.getTechnicianRatingSummary = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!['coordinator', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid technician id' });
    }

    const pipeline = [
      { $match: { assignedTechnician: new mongoose.Types.ObjectId(id), 'rating.stars': { $exists: true } } },
      {
        $group: {
          _id: '$assignedTechnician',
          count: { $sum: 1 },
          avgStars: { $avg: '$rating.stars' },
          dist1: { $sum: { $cond: [{ $eq: ['$rating.stars', 1] }, 1, 0] } },
          dist2: { $sum: { $cond: [{ $eq: ['$rating.stars', 2] }, 1, 0] } },
          dist3: { $sum: { $cond: [{ $eq: ['$rating.stars', 3] }, 1, 0] } },
          dist4: { $sum: { $cond: [{ $eq: ['$rating.stars', 4] }, 1, 0] } },
          dist5: { $sum: { $cond: [{ $eq: ['$rating.stars', 5] }, 1, 0] } },
        },
      },
    ];

    const [summary] = await Booking.aggregate(pipeline);
    const tech = await mongoose
      .model('Technician')
      .findById(id)
      .select('full_name email district specialization profile_image_url')
      .lean();

    return res.json({
      technician: tech
        ? {
            id: tech._id,
            name: tech.full_name,
            email: tech.email,
            district: tech.district,
            specialization: tech.specialization,
            profile_image_url: tech.profile_image_url,
          }
        : { id },
      summary: summary
        ? {
            count: summary.count,
            avgStars: Number(summary.avgStars?.toFixed(2)),
            distribution: {
              '1': summary.dist1,
              '2': summary.dist2,
              '3': summary.dist3,
              '4': summary.dist4,
              '5': summary.dist5,
            },
          }
        : { count: 0, avgStars: 0, distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
