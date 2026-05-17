const mongoose = require("mongoose"); //  needed for isValidObjectId
const Service = require("../models/Service");

// ---------- helpers ----------
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getUniqueSlug(base) {
  const seed = slugify(base);
  let slug = seed;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Service.exists({ slug })) slug = `${seed}-${i++}`;
  return slug;
}

function mapFilesToServiceImages(files = []) {
  // multer-storage-cloudinary provides: file.filename (public_id), file.path (secure URL)
  return files
    .filter((f) => !!f)
    .map((f) => ({ public_id: f.filename || null, url: f.path || null }))
    .filter((img) => img.url); // keep only valid ones
}

// ---------- admin: create (supports multiple images) ----------
exports.createService = async (req, res) => {
  try {
    const {
      name,
      slug,
      description = "",
      basePrice = 0,
      category = "General",
      isActive = true,
      imageUrls, // optional: string or array of URLs / base64 strings
    } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    const finalSlug = slug ? slugify(slug) : await getUniqueSlug(name);

    let serviceImages = [];
    // Files uploaded? (field name "images")
    if (Array.isArray(req.files) && req.files.length > 0) {
      serviceImages = mapFilesToServiceImages(req.files);
    }
    // Or raw URLs provided in JSON (imageUrls can be string or array)
    if (imageUrls) {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      serviceImages = serviceImages.concat(
        urls.filter(Boolean).map((u) => ({ public_id: null, url: u })),
      );
    }

    const createdBy =
      req.user?.role === "admin" && mongoose.isValidObjectId(req.user.id)
        ? req.user.id
        : null; // super_admin => null

    const doc = await Service.create({
      name,
      slug: finalSlug,
      description,
      basePrice,
      category,
      serviceImages,
      isActive,
      createdBy, // null for super_admin (env), ObjectId for normal admin
    });

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

// ---------- public: list with search + pagination ----------
// GET /api/services?q=&category=&page=&limit=
exports.listServices = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const category = (req.query.category || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "24", 10), 100);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);

    const baseFilter = { isActive: true };
    if (category) baseFilter.category = category;

    const query = q
      ? {
          ...baseFilter,
          $or: [
            { $text: { $search: q } },
            { name: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
          ],
        }
      : baseFilter;

    const [items, total] = await Promise.all([
      Service.find(query)
        .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name slug description basePrice category serviceImages"),
      Service.countDocuments(query),
    ]);

    res.json({
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ---------- public: get by slug ----------
// GET /api/services/:slug
exports.getServiceBySlug = async (req, res) => {
  try {
    const doc = await Service.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select("name slug description basePrice category serviceImages");
    if (!doc) return res.status(404).json({ message: "Service not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ---------- admin: update (supports replacing/adding images) ----------
exports.updateService = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = { ...req.body };

    // slug logic
    if (updates.slug) {
      updates.slug = slugify(updates.slug);
      const exists = await Service.exists({
        _id: { $ne: id },
        slug: updates.slug,
      });
      if (exists)
        return res.status(409).json({ message: "Slug already in use" });
    } else if (updates.name) {
      updates.slug = await getUniqueSlug(updates.name);
    }

    // images:
    // - If files present -> add to serviceImages (append)
    // - If imageUrls provided -> add those too
    // - If you need to *replace* entirely, send `replaceImages=true`
    const newImages = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      newImages.push(...mapFilesToServiceImages(req.files));
    }
    if (updates.imageUrls) {
      const urls = Array.isArray(updates.imageUrls)
        ? updates.imageUrls
        : [updates.imageUrls];
      newImages.push(
        ...urls.filter(Boolean).map((u) => ({ public_id: null, url: u })),
      );
      delete updates.imageUrls;
    }

    if (newImages.length > 0) {
      if (String(updates.replaceImages || "").toLowerCase() === "true") {
        updates.serviceImages = newImages;
      } else {
        // append
        const current = await Service.findById(id).select("serviceImages");
        updates.serviceImages = [
          ...(current?.serviceImages || []),
          ...newImages,
        ];
      }
      delete updates.replaceImages;
    }

    const doc = await Service.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: "Service not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// ---------- admin: delete (soft or hard) ----------
// DELETE /api/admin/services/:id?hard=true
exports.deleteService = async (req, res) => {
  try {
    const hard = String(req.query.hard || "").toLowerCase() === "true";
    if (hard) {
      const out = await Service.findByIdAndDelete(req.params.id);
      if (!out) return res.status(404).json({ message: "Service not found" });
      return res.json({ message: "Deleted" });
    }
    const doc = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!doc) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Deactivated", service: doc });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// ---------- admin: list ALL (active + inactive) ----------
exports.adminListServices = async (_req, res) => {
  try {
    const items = await Service.find({}).sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ---------- admin: activate (flip isActive:true) ----------
exports.activateService = async (req, res) => {
  try {
    const doc = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true },
    );
    if (!doc) return res.status(404).json({ message: "Service not found" });
    res.json({ message: "Activated", service: doc });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
