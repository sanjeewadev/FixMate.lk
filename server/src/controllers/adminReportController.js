const mongoose = require("mongoose");
const Booking = require("../models/Booking");

/* ------------------------------ Helpers ------------------------------ */

function parseDate(s) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildDateMatch(req) {
  // Use payment confirmation date for finance reporting; fallback to workCompletedAt
  const { from, to } = req.query || {};
  const range = {};
  const path = "payment.confirmedByTechnicianAt";

  if (from) {
    const d = parseDate(from);
    if (d) range.$gte = d;
  }
  if (to) {
    const d = parseDate(to);
    if (d) range.$lte = d;
  }

  // If range has bounds, match on confirmed date; otherwise, no date filter
  if (Object.keys(range).length) {
    return { [path]: range };
  }
  return {};
}

function getProfitProjection(req) {
  // By default, profit = serviceCharge (platform margin)
  // Optional commissionRate (0..1) makes profit = grandTotal * commissionRate
  const r = Number(req.query?.commissionRate);
  const hasRate = !Number.isNaN(r) && r >= 0 && r <= 1;
  return hasRate
    ? { $multiply: ["$payment.grandTotal", r] }
    : "$payment.serviceCharge";
}

function baseMatch(req) {
  return {
    status: "completed",
    payment: { $ne: null },
    ...buildDateMatch(req),
  };
}

/* ------------------------------ Summary ------------------------------ */
/**
 * GET /api/admin/reports/payments/summary?from=2025-01-01&to=2025-12-31&commissionRate=0.1
 * Returns totals for revenue, expenses, serviceCharge, profit, count.
 */
exports.getPaymentSummary = async (req, res) => {
  try {
    const profitExpr = getProfitProjection(req);

    const [row] = await Booking.aggregate([
      { $match: baseMatch(req) },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payment.grandTotal" },
          totalExpenses: { $sum: "$payment.expensesTotal" },
          totalServiceCharge: { $sum: "$payment.serviceCharge" },
          totalProfit: { $sum: profitExpr },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalExpenses: 1,
          totalServiceCharge: 1,
          totalProfit: { $ifNull: ["$totalProfit", 0] },
          count: 1,
        },
      },
    ]);

    res.json(row || {
      totalRevenue: 0,
      totalExpenses: 0,
      totalServiceCharge: 0,
      totalProfit: 0,
      count: 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ------------------------------ Top Services ------------------------------ */
/**
 * GET /api/admin/reports/payments/top-services?limit=10&from=...&to=...
 * Returns top services by revenue (and profit).
 */
exports.getTopServices = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query?.limit) || 10));
    const profitExpr = getProfitProjection(req);

    const rows = await Booking.aggregate([
      { $match: baseMatch(req) },
      {
        $group: {
          _id: "$service",
          revenue: { $sum: "$payment.grandTotal" },
          expenses: { $sum: "$payment.expensesTotal" },
          serviceCharge: { $sum: "$payment.serviceCharge" },
          profit: { $sum: profitExpr },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          serviceId: "$_id",
          serviceName: "$service.name",
          serviceCode: "$service.code",
          revenue: 1,
          expenses: 1,
          serviceCharge: 1,
          profit: 1,
          count: 1,
        },
      },
    ]);

    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ------------------------------ Top Districts ------------------------------ */
/**
 * GET /api/admin/reports/payments/top-districts?limit=10
 */
exports.getTopDistricts = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query?.limit) || 10));
    const profitExpr = getProfitProjection(req);

    const rows = await Booking.aggregate([
      { $match: baseMatch(req) },
      {
        $group: {
          _id: "$customerSnapshot.district",
          revenue: { $sum: "$payment.grandTotal" },
          expenses: { $sum: "$payment.expensesTotal" },
          serviceCharge: { $sum: "$payment.serviceCharge" },
          profit: { $sum: profitExpr },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          district: "$_id",
          revenue: 1,
          expenses: 1,
          serviceCharge: 1,
          profit: 1,
          count: 1,
        },
      },
    ]);

    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ------------------------------ Top Technicians ------------------------------ */
/**
 * GET /api/admin/reports/payments/top-technicians?limit=10
 */
exports.getTopTechnicians = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query?.limit) || 10));
    const profitExpr = getProfitProjection(req);

    const rows = await Booking.aggregate([
      { $match: baseMatch(req) },
      {
        $group: {
          _id: "$assignedTechnician",
          revenue: { $sum: "$payment.grandTotal" },
          expenses: { $sum: "$payment.expensesTotal" },
          serviceCharge: { $sum: "$payment.serviceCharge" },
          profit: { $sum: profitExpr },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "technicians",
          localField: "_id",
          foreignField: "_id",
          as: "technician",
        },
      },
      { $unwind: { path: "$technician", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          technicianId: "$_id",
          technicianName: "$technician.name",
          technicianEmail: "$technician.email",
          technicianPhone: "$technician.phone",
          revenue: 1,
          expenses: 1,
          serviceCharge: 1,
          profit: 1,
          count: 1,
        },
      },
    ]);

    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ------------------------------ Highest Booking ------------------------------ */
/**
 * GET /api/admin/reports/payments/highest-booking
 * Highest grossing single booking.
 */
exports.getHighestBooking = async (req, res) => {
  try {
    const [row] = await Booking.aggregate([
      { $match: baseMatch(req) },
      { $sort: { "payment.grandTotal": -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "services",
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "technicians",
          localField: "assignedTechnician",
          foreignField: "_id",
          as: "technician",
        },
      },
      { $unwind: { path: "$technician", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          serviceId: "$service._id",
          serviceName: "$service.name",
          serviceCode: "$service.code",
          technicianId: "$technician._id",
          technicianName: "$technician.name",
          customerDistrict: "$customerSnapshot.district",
          workCompletedAt: 1,
          payment: 1,
        },
      },
    ]);

    res.json(row || null);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* ------------------------------ Time Series ------------------------------ */
/**
 * GET /api/admin/reports/payments/daily?from=2025-01-01&to=2025-01-31
 * Group by day.
 */
exports.getDailySeries = async (req, res) => {
  try {
    const profitExpr = getProfitProjection(req);
    const rows = await Booking.aggregate([
      { $match: baseMatch(req) },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$payment.confirmedByTechnicianAt" },
          },
          revenue: { $sum: "$payment.grandTotal" },
          expenses: { $sum: "$payment.expensesTotal" },
          serviceCharge: { $sum: "$payment.serviceCharge" },
          profit: { $sum: profitExpr },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          _id: 0,
          revenue: 1,
          expenses: 1,
          serviceCharge: 1,
          profit: 1,
          count: 1,
        },
      },
    ]);

    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/admin/reports/payments/monthly?from=2025-01-01&to=2025-12-31
 * Group by year-month.
 */
exports.getMonthlySeries = async (req, res) => {
  try {
    const profitExpr = getProfitProjection(req);
    const rows = await Booking.aggregate([
      { $match: baseMatch(req) },
      {
        $group: {
          _id: {
            y: { $year: "$payment.confirmedByTechnicianAt" },
            m: { $month: "$payment.confirmedByTechnicianAt" },
          },
          revenue: { $sum: "$payment.grandTotal" },
          expenses: { $sum: "$payment.expensesTotal" },
          serviceCharge: { $sum: "$payment.serviceCharge" },
          profit: { $sum: profitExpr },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.y",
          month: "$_id.m",
          yearMonth: {
            $concat: [
              { $toString: "$_id.y" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.m", 10] },
                  { $concat: ["0", { $toString: "$_id.m" }] },
                  { $toString: "$_id.m" },
                ],
              },
            ],
          },
          revenue: 1,
          expenses: 1,
          serviceCharge: 1,
          profit: 1,
          count: 1,
        },
      },
    ]);

    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
