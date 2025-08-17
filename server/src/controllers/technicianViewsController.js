const Technician = require("../models/Technician");
const Customer = require("../models/Customer");

// GET /api/technician/technicians
// List all technicians with full info (NO password)
exports.listTechniciansForTech = async (req, res) => {
  try {
    if (req.user?.role !== "technician") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const items = await Technician.find({})
      .select("-password_hash")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/technician/customers/public
// List all customers WITHOUT personal details
// (No email, no phone, no address; just non-identifying summary)
// You can adjust fields as needed.
exports.listCustomersPublicForTech = async (req, res) => {
  try {
    if (req.user?.role !== "technician") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Pick a very safe projection: show only id, name initials, and district
    // (No email/phone/address/profile image)
    const items = await Customer.find({}, { _id: 1, full_name: 1, district: 1 }).lean();
res.json(items);


    // Optionally anonymize name to initials to reduce personal data exposure
    const safe = items.map((c) => {
      const parts = String(c.full_name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const initials = parts.map((p) => p[0]?.toUpperCase()).join("");
      return {
        id: c._id,
        name_initials: initials || "C",
        district: c.district,
      };
    });

    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
