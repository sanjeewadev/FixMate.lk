const Technician = require("../models/Technician");
const Customer = require("../models/Customer");

// GET /api/technician/technicians
// List all technicians with full info (NO password)
exports.listTechniciansForTech = async (req, res) => {
  try {
    
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
    const role = req.user?.role;
    const allowed = ["technician", "coordinator", "admin", "super_admin"];
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (role === "technician") {
      // privacy-safe projection for techs
      const items = await Customer.find(
        {},
        { _id: 1, full_name: 1, district: 1, profile_image_url: 1 }
      ).lean();

      const safe = items.map((c) => {
        const initials = String(c.full_name || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0]?.toUpperCase())
          .join("");
        return {
          _id: c._id,
          name_initials: initials || "C",
          district: c.district,
          profile_image_url: c.profile_image_url || null,
        };
      });

      return res.json(safe);
    }

    // Staff roles: send full details
    const full = await Customer.find(
      {},
      {
        _id: 1,
        full_name: 1,
        email: 1,
        phone_number: 1,
        address: 1,
        district: 1,
        profile_image_url: 1,
        createdAt: 1,
      }
    ).lean();

    return res.json(full);
  } catch (e) {
    console.error("listCustomersPublicForTech error", e);
    res.status(500).json({ message: "Server error" });
  }
};

