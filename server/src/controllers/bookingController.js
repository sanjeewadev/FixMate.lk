// controllers/bookingController.js
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

async function attachSpecLabels(techs) {
  // Collect ObjectIds we can resolve to Service names (if any)
  const idSet = new Set();
  for (const t of techs) {
    const arr = Array.isArray(t.specialization) ? t.specialization : [];
    for (const v of arr) {
      if (mongoose.isValidObjectId(v)) idSet.add(String(v));
    }
  }

  let nameById = {};
  if (idSet.size) {
    const services = await Service.find({ _id: { $in: Array.from(idSet) } })
      .select("name")
      .lean();
    nameById = Object.fromEntries(services.map(s => [String(s._id), s.name || "Service"]));
  }

  return techs.map(t => {
    const arr = Array.isArray(t.specialization) ? t.specialization : [];
    const labels = arr.map(v => {
      if (!v) return null;
      if (typeof v === "string") return v;                       // already a readable string
      if (v && typeof v === "object" && v.name) return v.name;   // in case some docs already embedded objects
      const asId = String(v);
      return nameById[asId] || null;                              // resolve ObjectId → Service name
    }).filter(Boolean);

    return { ...t, specialization_labels: labels };
  });
}


// ---- lightweight notify helper (optional) ----
// If you set app.locals.notify = (event, payload) => {...}, you'll receive these events.
// Otherwise this safely no-ops.
function notify(app, event, payload) {
  try {
    const fn = app?.locals?.notify;
    if (typeof fn === 'function') fn(event, payload);
  } catch (e) {
    console.warn('notify() failed:', e?.message || e);
  }
}

// ---- tiny guard for technician suspension ----
async function getActiveTechnicianOrBlock(userId, res) {
  const tech = await Technician.findById(userId).lean();
  if (!tech) {
    res.status(404).json({ message: 'Technician not found' });
    return null;
  }
  if (tech.is_suspended) {
    res.status(403).json({ message: 'Technician account is suspended' });
    return null;
  }
  return tech;
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

    // NEW: lightweight notification so techs/coordinators/admins can be alerted and list immediately
    notify(req.app, 'booking:new', {
      bookingId: doc._id,
      district: snapshot.district,
      serviceId: String(service._id),
      serviceName: service.name,
      problemTitle,
      createdAt: doc.createdAt
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

    const tech = await getActiveTechnicianOrBlock(req.user.id, res);
    if (!tech) return; // 404/403 already sent

    const itemsRaw = await Booking.find({
      'customerSnapshot.district': tech.district,
      assignedTechnician: null,
      status: 'pending' // keep your adjusted filter
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

    const tech = await getActiveTechnicianOrBlock(req.user.id, res);
    if (!tech) return;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

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

    const tech = await getActiveTechnicianOrBlock(req.user.id, res);
    if (!tech) return;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

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

// TECHNICIAN: my bookings by status (for dashboard tabs)
// GET /api/technician/bookings/mine?status=awaiting_coordinator|coordinator_approved|completed|in_progress
exports.listMineForTechnician = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user?.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tech = await getActiveTechnicianOrBlock(req.user.id, res);
    if (!tech) return;

    const techId = new mongoose.Types.ObjectId(String(req.user.id));
    const status = String(req.query?.status || '').trim();

    if (status === 'awaiting_coordinator') {
      const items = await Booking.find({
        assignedTechnician: null,
        status: 'awaiting_coordinator',
        technicianResponses: { $elemMatch: { technician: techId, status: 'accepted' } }
      }).populate('service', 'name category').sort({ createdAt: -1 }).lean();
      return res.json(items);
    }

    if (status === 'coordinator_approved') {
      const items = await Booking.find({
        assignedTechnician: techId,
        status: { $in: ['coordinator_approved', 'in_progress'] }
      }).populate('service', 'name category').sort({ createdAt: -1 }).lean();
      return res.json(items);
    }

    if (status === 'completed') {
      const items = await Booking.find({
        assignedTechnician: techId,
        status: 'completed'
      }).populate('service', 'name category').sort({ createdAt: -1 }).lean();
      return res.json(items);
    }

    return res.json([]);
  } catch (e) {
    console.error('listMineForTechnician error', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
};

// TECHNICIAN: View one booking (reveal phone if accepted or assigned to this tech)
// GET /api/technician/bookings/:id
exports.getTechnicianBooking = async (req, res) => {
  try {
    if (req.user?.role !== 'technician' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tech = await getActiveTechnicianOrBlock(req.user.id, res);
    if (!tech) return;

    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name category')
      .populate('assignedTechnician', '_id')
      .lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

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
    if (tech.is_suspended) return res.status(409).json({ message: 'Cannot assign a suspended technician' });
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

exports.cancelMyBooking = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { reason = '' } = req.body || {};

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Must be the owner
    if (String(booking.customer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // ❗Allowed ONLY before coordinator approval
    const cancellableStatuses = ['pending', 'awaiting_coordinator'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res
        .status(409)
        .json({ message: `Cannot cancel after approval. Current status: ${booking.status}` });
    }

    // Optional audit fields if you added them in the schema
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    await booking.save();

    return res.json({ message: 'Booking cancelled', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

/* -------------------- NEW: Coordinator/Admin visibility & actions -------------------- */

// COORDINATOR/ADMIN: see ALL unassigned requests (including brand-new 'pending')
// GET /api/coordinator/bookings?status=pending|awaiting_coordinator&district=Colombo&q=leak
exports.listForCoordinator = async (req, res) => {
  try {
    const allowed = ['coordinator','admin','super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { status, district, q } = req.query || {};
    const find = {};
   const unassignedStatuses = ['pending','awaiting_coordinator'];
   const assignedStatuses   = ['coordinator_approved','in_progress','completed'];

   if (!status) {
     // default: unassigned buckets
     find.assignedTechnician = null;
     find.status = { $in: unassignedStatuses };
   } else if (unassignedStatuses.includes(status)) {
     find.assignedTechnician = null;
     find.status = status;
   } else if (assignedStatuses.includes(status)) {
     // show assigned jobs for these states
     find.assignedTechnician = { $ne: null };
     find.status = status;
   } else {
     // unknown status → return empty set deliberately
     find._id = { $exists: false };
   }
    if (district) find['customerSnapshot.district'] = district;
    if (q) find.problemTitle = { $regex: q, $options: 'i' };

    const items = await Booking.find(find)
      .populate('service', 'name category')
      .populate(
        'assignedTechnician',
        'full_name email phone_number district specialization experience_years profile_image_url'
      )
      .sort({ createdAt: -1 })
      .lean();

    const out = items.map(b => ({
      ...b,
      acceptedCount: (b.technicianResponses || []).filter(r => r.status === 'accepted').length
    }));

    return res.json(out);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// COORDINATOR/ADMIN: summarized dashboard buckets (unclaimed vs awaiting approval)
// GET /api/coordinator/bookings/dashboard?district=Colombo
exports.coordinatorDashboard = async (req, res) => {
  try {
    const allowed = ['coordinator','admin','super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { district } = req.query || {};
    const base = { assignedTechnician: null, status: { $in: ['pending','awaiting_coordinator'] } };
    if (district) base['customerSnapshot.district'] = district;

    const [unclaimed, awaiting] = await Promise.all([
      Booking.find({ ...base, status: 'pending' })
        .populate('service', 'name category')
        .sort({ createdAt: -1 })
        .lean(),
      Booking.find({
        ...base,
        status: 'awaiting_coordinator',
        'technicianResponses.status': 'accepted'
      })
        .populate('service', 'name category')
        .populate('technicianResponses.technician', 'full_name phone_number district specialization experience_years profile_image_url')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const addCounts = b => ({
      ...b,
      acceptedCount: (b.technicianResponses || []).filter(r => r.status === 'accepted').length
    });

    return res.json({
      unclaimed: unclaimed.map(addCounts),                 // brand new – no accepted tech yet
      awaitingCoordinator: awaiting.map(addCounts)         // at least one tech accepted
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// COORDINATOR/ADMIN: manual assign (even if no tech accepted yet)
// POST /api/coordinator/bookings/:id/assign
// body: { technicianId }
exports.coordinatorAssign = async (req, res) => {
  try {
    const allowed = ['coordinator','admin','super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    const { technicianId } = req.body || {};
    if (!mongoose.isValidObjectId(technicianId)) {
      return res.status(400).json({ message: 'technicianId is required' });
    }

    const [booking, tech] = await Promise.all([
      Booking.findById(id),
      Technician.findById(technicianId)
    ]);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    if (tech.is_suspended) return res.status(409).json({ message: 'Cannot assign a suspended technician' });

    // Set/overwrite assignment
    booking.assignedTechnician = tech._id;
    // Treat this as approval to proceed (align with your current coordinatorApprove status)
    booking.status = 'coordinator_approved';

    

    await booking.save();

    notify(req.app, 'booking:assigned', {
      bookingId: booking._id,
      technicianId: String(tech._id),
      assignedBy: req.user?.id || null
    });

    return res.json({ message: 'Assigned by coordinator', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// COORDINATOR/ADMIN: reassign to a different technician (before job completion)
// POST /api/coordinator/bookings/:id/reassign
// body: { technicianId }
exports.coordinatorReassign = async (req, res) => {
  try {
    const allowed = ['coordinator','admin','super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    const { technicianId } = req.body || {};
    if (!mongoose.isValidObjectId(technicianId)) {
      return res.status(400).json({ message: 'technicianId is required' });
    }

    const [booking, tech] = await Promise.all([
      Booking.findById(id),
      Technician.findById(technicianId)
    ]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    if (tech.is_suspended) return res.status(409).json({ message: 'Cannot assign a suspended technician' });

    // Guard: only allow reassign while in pre-work states
    const lockedStatuses = ['cancelled','completed']; // extend if you track 'in_progress'
    if (lockedStatuses.includes(booking.status)) {
      return res.status(409).json({ message: `Cannot reassign in status: ${booking.status}` });
    }

    booking.assignedTechnician = tech._id;
    if (booking.status !== 'coordinator_approved') booking.status = 'coordinator_approved';

    

    await booking.save();

    notify(req.app, 'booking:reassigned', {
      bookingId: booking._id,
      technicianId: String(tech._id),
      reassignedBy: req.user?.id || null
    });

    return res.json({ message: 'Reassigned', bookingId: booking._id });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// COORDINATOR/ADMIN: hard delete a booking (only early states, unassigned)
exports.coordinatorDelete = async (req, res) => {
  try {
    const allowed = ['coordinator', 'admin', 'super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Safety guard: only allow deleting unassigned & early-stage bookings
    if (booking.assignedTechnician) {
      return res.status(409).json({ message: 'Cannot delete after assignment' });
    }
    if (!['pending', 'awaiting_coordinator'].includes(booking.status)) {
      return res.status(409).json({ message: `Cannot delete in status: ${booking.status}` });
    }

    await Booking.deleteOne({ _id: id });
    return res.json({ message: 'Booking deleted' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// ========= Add to controllers/bookingController.js (bottom) =========
const escapeRx = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildSpecMatch({ serviceId, serviceCategory }) {
  const or = [];

  // If specialization stores Service ObjectIds
  if (serviceId && mongoose.isValidObjectId(serviceId)) {
    or.push({ specialization: new mongoose.Types.ObjectId(String(serviceId)) });
  }

  // If specialization stores strings (category/code/slug/name)
  if (serviceCategory) {
    or.push({ specialization: serviceCategory });
  }

  // If you also use service code/slug strings on specialization, add here:
  // or.push({ specialization: serviceCodeOrSlug });

  return or.length ? { $or: or } : null;
}

// GET /api/coordinator/technicians?district=&q=&page=1&limit=20
exports.listTechniciansForCoordinator = async (req, res) => {
  try {
    const allowed = ['coordinator','admin','super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    let { district, q, page = 1, limit = 20 } = req.query || {};
    page  = Math.max(1, Number(page) || 1);
    limit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (page - 1) * limit;

    const find = { is_suspended: { $ne: true } };
    if (district) {
      find.district = new RegExp(`^${escapeRx(String(district).trim())}$`, 'i'); // case-insensitive
    }
    if (q) {
      const rx = new RegExp(escapeRx(q), 'i');
      find.$or = [{ full_name: rx }, { phone_number: rx }, { email: rx }];
    }

    const [raw, total] = await Promise.all([
      Technician.find(find)
        .select('full_name phone_number email district specialization experience_years profile_image_url')
        .sort({ full_name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Technician.countDocuments(find),
    ]);

    const items = await attachSpecLabels(raw);  // <-- add labels, no populate
    res.json({ items, page, limit, total });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
};



// GET /api/coordinator/technicians/candidates?bookingId=...
exports.candidatesForBooking = async (req, res) => {
  try {
    const allowed = ['coordinator','admin','super_admin'].includes(req.user?.role);
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { bookingId } = req.query || {};
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'bookingId required' });
    }

    const b = await Booking.findById(bookingId)
      .populate('service', 'category code slug name')
      .lean();
    if (!b) return res.status(404).json({ message: 'Booking not found' });

    const district = b.customerSnapshot?.district;

    const find = { is_suspended: { $ne: true } };
    if (district) {
      find.district = new RegExp(`^${escapeRx(String(district).trim())}$`, 'i');
    }

    const raw = await Technician.find(find)
      .select('full_name phone_number email district specialization experience_years profile_image_url')
      .sort({ full_name: 1 })
      .lean();

    const items = await attachSpecLabels(raw);

    res.json({
      booking: {
        _id: String(b._id),
        district,
        service: { id: String(b.service?._id || ''), name: b.service?.name, category: b.service?.category },
      },
      items
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
};



