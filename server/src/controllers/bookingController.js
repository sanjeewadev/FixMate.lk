const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Technician = require('../models/Technician'); // ensure this exists

// ---- helpers ----
function filesToMedia(files = []) {
  // Your uploader provides .filename (public_id) and .path (secure URL)
  return (files || [])
    .filter(Boolean)
    .map(f => ({ public_id: f.filename || null, url: f.path || null }))
    .filter(m => !!m.url);
}

// CUSTOMER: Create a new booking
// POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      serviceId,
      preferredAt,
      timeSlot,
      brandModel,
      equipmentAge,
      problemTitle,
      problemDescription = '',
      specialInstructions = '',
      address,    // editable snapshot
      district,   // editable snapshot
      phone_number // editable snapshot
    } = req.body;

    if (!serviceId || !preferredAt || !problemTitle) {
      return res.status(400).json({ message: 'serviceId, preferredAt, and problemTitle are required' });
    }

    const customer = await Customer.findById(req.user.id).lean();
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const service = await Service.findById(serviceId).lean();
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Build snapshot from customer, allow overrides
    const snapshot = {
      full_name: customer.full_name,
      phone_number: phone_number || customer.phone_number || '',
      address: address || customer.address,
      district: district || customer.district
    };
    if (!snapshot.address || !snapshot.district || !snapshot.phone_number) {
      return res.status(400).json({ message: 'address, district and phone_number are required' });
    }

    const media = filesToMedia(req.files);

    const doc = await Booking.create({
      customer: customer._id,
      service: service._id,
      customerSnapshot: snapshot,
      preferredAt: new Date(preferredAt),
      timeSlot: timeSlot || null,
      serviceCategory: service.category || null,
      brandModel: brandModel || '',
      equipmentAge: equipmentAge || '',
      problemTitle,
      problemDescription,
      specialInstructions,
      media,
      status: 'pending'
    });

    return res.status(201).json(doc);
  } catch (e) {
    console.error('createBooking error', e);
    return res.status(400).json({ message: e.message });
  }
};

// CUSTOMER: My bookings
// GET /api/bookings/mine
exports.listMyBookings = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const items = await Booking.find({ customer: req.user.id })
      .populate('service', 'name slug category serviceImages')
      .populate('assignedTechnician', 'full_name phone_number district specialization experience_years profile_image_url')
      .sort({ createdAt: -1 });
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// TECHNICIAN: Available bookings in my district (before assignment)
// Shows Service Type & Category, Problem Title + Description, Uploaded Photos, Brand/Model, Equipment Age,
// Preferred Date & Time, Service Address (NO phone yet)
exports.listAvailableForTechnician = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tech = await Technician.findById(req.user.id).lean();
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    const itemsRaw = await Booking.find({
      'customerSnapshot.district': tech.district,
      assignedTechnician: null,
      status: { $in: ['pending', 'awaiting_coordinator'] }
    })
    .populate('service', 'name category')
    .sort({ createdAt: -1 })
    .lean();

    // Build response without phone_number
    const items = itemsRaw.map(b => ({
      _id: b._id,
      service: {
        _id: b.service?._id,
        name: b.service?.name,            // Service Type (name)
        category: b.service?.category     // Service Category
      },
      problemTitle: b.problemTitle,
      problemDescription: b.problemDescription,
      media: b.media,                     // uploaded images
      brandModel: b.brandModel,
      equipmentAge: b.equipmentAge,
      preferredAt: b.preferredAt,
      timeSlot: b.timeSlot,
      serviceAddress: b.customerSnapshot.address,  // needed to accept
      customerSnapshot: {
        full_name: b.customerSnapshot.full_name,
        district: b.customerSnapshot.district
        // phone_number intentionally omitted
      },
      createdAt: b.createdAt
    }));

    return res.json(items);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// TECHNICIAN: Accept
// POST /api/technician/bookings/:id/accept
exports.technicianAccept = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [booking, tech] = await Promise.all([
      Booking.findById(req.params.id),
      Technician.findById(req.user.id).lean()
    ]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    if (booking.assignedTechnician) {
      return res.status(409).json({ message: 'Already assigned' });
    }
    // Only displayable list is by district; guard anyway
    if (tech.district !== booking.customerSnapshot.district) {
      return res.status(403).json({ message: 'Forbidden: district mismatch' });
    }

    booking.technicianResponses = (booking.technicianResponses || [])
      .filter(r => String(r.technician) !== String(tech._id));
    booking.technicianResponses.push({ technician: tech._id, status: 'accepted' });

    if (booking.status === 'pending') booking.status = 'awaiting_coordinator';

    await booking.save();
    return res.json({ message: 'Accepted', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// TECHNICIAN: Decline
// POST /api/technician/bookings/:id/decline
exports.technicianDecline = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [booking, tech] = await Promise.all([
      Booking.findById(req.params.id),
      Technician.findById(req.user.id).lean()
    ]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    if (tech.district !== booking.customerSnapshot.district) {
      return res.status(403).json({ message: 'Forbidden: district mismatch' });
    }

    booking.technicianResponses = (booking.technicianResponses || [])
      .filter(r => String(r.technician) !== String(tech._id));
    booking.technicianResponses.push({ technician: tech._id, status: 'declined' });

    await booking.save();
    return res.json({ message: 'Declined', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// TECHNICIAN: View one booking (reveal phone if accepted or assigned to this tech)
// GET /api/technician/bookings/:id
exports.getTechnicianBooking = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name category')
      .populate('assignedTechnician', '_id')
      .lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const tech = await Technician.findById(req.user.id).lean();
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    // If assigned to a different tech → forbid
    if (booking.assignedTechnician && String(booking.assignedTechnician._id) !== String(tech._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // If not assigned, require same district to preview
    if (!booking.assignedTechnician && tech.district !== booking.customerSnapshot.district) {
      return res.status(403).json({ message: 'Forbidden: district mismatch' });
    }

    const hasAccepted = (booking.technicianResponses || [])
      .some(r => String(r.technician) === String(tech._id) && r.status === 'accepted');

    const cs = booking.customerSnapshot;
    return res.json({
      _id: booking._id,
      service: { _id: booking.service?._id, name: booking.service?.name, category: booking.service?.category },
      problemTitle: booking.problemTitle,
      problemDescription: booking.problemDescription,
      media: booking.media,
      brandModel: booking.brandModel,
      equipmentAge: booking.equipmentAge,
      preferredAt: booking.preferredAt,
      timeSlot: booking.timeSlot,
      serviceAddress: cs.address,
      customerSnapshot: {
        full_name: cs.full_name,
        district: cs.district,
        phone_number: (hasAccepted || (booking.assignedTechnician && String(booking.assignedTechnician._id) === String(tech._id)))
          ? cs.phone_number
          : undefined // hidden before accept/assign
      },
      status: booking.status,
      assignedTechnician: booking.assignedTechnician
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// COORDINATOR/ADMIN: list awaiting approval (has accepts)
exports.listPendingApproval = async (_req, res) => {
  try {
    const items = await Booking.find({
      assignedTechnician: null,
      status: { $in: ['awaiting_coordinator'] },
      'technicianResponses.status': 'accepted'
    })
    .populate('service', 'name category')
    .populate('technicianResponses.technician', 'full_name phone_number district specialization experience_years profile_image_url')
    .sort({ createdAt: -1 });
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// COORDINATOR/ADMIN: approve + assign ANY technician (no district restriction)
exports.coordinatorApprove = async (req, res) => {
  try {
    const id = req.params.id;
    const { technicianId } = req.body;

    if (!mongoose.isValidObjectId(technicianId)) {
      return res.status(400).json({ message: 'technicianId is required' });
    }

    const [booking, tech] = await Promise.all([
      Booking.findById(id),
      Technician.findById(technicianId)
    ]);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    if (booking.assignedTechnician) return res.status(409).json({ message: 'Already assigned' });

    booking.assignedTechnician = tech._id;
    booking.status = 'coordinator_approved';
    await booking.save();

    return res.json({ message: 'Approved and assigned', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// CUSTOMER/COORDINATOR/ADMIN: get one booking (customer sees assigned tech details after approval)
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name slug category')
      .populate('assignedTechnician', 'full_name phone_number district specialization experience_years profile_image_url');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = req.user?.role === 'customer' && String(booking.customer) === String(req.user.id);
    const elevated = ['coordinator','admin','super_admin'].includes(req.user?.role);
    const techSelf = req.user?.role === 'technician' &&
                     booking.assignedTechnician &&
                     String(booking.assignedTechnician._id) === String(req.user.id);

    if (!(isOwner || elevated || techSelf)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(booking);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
