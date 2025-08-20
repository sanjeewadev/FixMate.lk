const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');

/**
 * GET /api/customer/bookings/receipts
 * Returns completed bookings for the logged-in customer that have a payment (receipt).
 */
exports.listReceipts = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const items = await Booking.find({
      customer: req.user.id,
      status: 'completed',
      payment: { $ne: null }
    })
      .select([
        'service',
        'customerSnapshot',
        'preferredAt',
        'timeSlot',
        'serviceCategory',
        'brandModel',
        'problemTitle',
        'workCompletedAt',
        'payment',
        'assignedTechnician',
        'createdAt',
        'updatedAt'
      ].join(' '))
      .populate({ path: 'service', select: 'name code' })
      .populate({ path: 'assignedTechnician', select: 'name email phone' })
      .sort({ workCompletedAt: -1, createdAt: -1 });

    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};


/**
 * GET /api/customer/bookings/:id/receipt
 * Returns a single completed booking (with payment) owned by this customer.
 */
exports.getReceipt = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const item = await Booking.findOne({
      _id: id,
      customer: req.user.id,
      status: 'completed',
      payment: { $ne: null }
    })
      .select([
        'service',
        'customerSnapshot',
        'preferredAt',
        'timeSlot',
        'serviceCategory',
        'brandModel',
        'problemTitle',
        'problemDescription',
        'notes',
        'expenses',
        'workCompletedAt',
        'payment',
        'assignedTechnician',
        'createdAt',
        'updatedAt'
      ].join(' '))
      .populate({ path: 'service', select: 'name code' })
      .populate({ path: 'assignedTechnician', select: 'name email phone' });

    if (!item) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    return res.json({ item });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};


/**
 * GET /api/customer/bookings/:id/receipt.pdf
 * Streams a PDF receipt if the booking belongs to the logged-in customer and is completed with payment.
 */
exports.downloadReceiptPdf = async (req, res) => {
  try {
    if (req.user?.role !== 'customer' || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findOne({
      _id: id,
      customer: req.user.id,
      status: 'completed',
      payment: { $ne: null }
    })
      .select([
        'service',
        'customerSnapshot',
        'preferredAt',
        'timeSlot',
        'serviceCategory',
        'brandModel',
        'problemTitle',
        'problemDescription',
        'notes',
        'expenses',
        'workCompletedAt',
        'payment',
        'assignedTechnician',
        'createdAt',
        'updatedAt'
      ].join(' '))
      .populate({ path: 'service', select: 'name code' })
      .populate({ path: 'assignedTechnician', select: 'name email phone' });

    if (!booking) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const fmt = (num) =>
      new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: booking.payment?.currency || 'LKR',
        maximumFractionDigits: 2
      }).format(Number(num || 0));

    const receiptNo =
      booking?.payment?.receiptNumber ||
      `FM-${new Date().getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`;
    const filename = `${receiptNo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    doc.pipe(res);

    // Branding
    doc
      .fontSize(20)
      .text('FixMate.lk', { align: 'left' })
      .moveDown(0.2)
      .fontSize(10)
      .fillColor('#555555')
      .text('Smart Home Service Platform', { align: 'left' })
      .moveDown(1);

    // Title + meta
    doc
      .fillColor('#000000')
      .fontSize(16)
      .text('Receipt', { align: 'right' })
      .fontSize(10)
      .text(`Receipt No: ${receiptNo}`, { align: 'right' })
      .text(
        `Date: ${new Date(booking.workCompletedAt || booking.updatedAt).toLocaleString('en-LK')}`,
        { align: 'right' }
      )
      .moveDown(1);

    // Customer & Service
    const leftX = doc.x;
    const startY = doc.y;

    doc
      .fontSize(12)
      .text('Billed To', leftX, startY)
      .moveDown(0.3)
      .fontSize(10)
      .fillColor('#333333')
      .text(booking.customerSnapshot?.full_name || 'Customer')
      .text(booking.customerSnapshot?.address || '')
      .text(booking.customerSnapshot?.district || '')
      .text(`Phone: ${booking.customerSnapshot?.phone_number || '-'}`)
      .moveDown(0.8)
      .fillColor('#000000')
      .fontSize(12)
      .text('Service Details')
      .moveDown(0.3)
      .fontSize(10)
      .fillColor('#333333')
      .text(`Service: ${booking.service?.name || '-'}`)
      .text(`Category: ${booking.serviceCategory || '-'}`)
      .text(`Brand/Model: ${booking.brandModel || '-'}`)
      .text(`Problem: ${booking.problemTitle || '-'}`)
      .moveDown(0.3)
      .text(
        `Preferred: ${
          booking.preferredAt ? new Date(booking.preferredAt).toLocaleString('en-LK') : '-'
        }`
      )
      .text(`Time Slot: ${booking.timeSlot || '-'}`)
      .moveDown(0.8)
      .fillColor('#000000')
      .fontSize(12)
      .text('Technician')
      .moveDown(0.3)
      .fontSize(10)
      .fillColor('#333333')
      .text(`${booking.assignedTechnician?.name || '-'}`)
      .text(`Email: ${booking.assignedTechnician?.email || '-'}`)
      .text(`Phone: ${booking.assignedTechnician?.phone || '-'}`)
      .moveDown(1);

    // Charges
    doc
      .fillColor('#000000')
      .fontSize(12)
      .text('Charges', { underline: true })
      .moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 36;   // description
    const col2 = 400;  // amount

    // Headers
    doc.fontSize(10).text('Description', col1, tableTop).text('Amount', col2, tableTop, { align: 'right' });
    doc.moveTo(36, tableTop + 14).lineTo(559, tableTop + 14).strokeColor('#cccccc').stroke();
    let cursorY = tableTop + 22;

    // Service Charge
    doc.fontSize(10).fillColor('#333333');
    doc.text('Service Charge', col1, cursorY).text(fmt(booking.payment?.serviceCharge || 0), col2, cursorY, { align: 'right' });
    cursorY += 16;

    // Expenses
    const expenses = Array.isArray(booking.expenses) ? booking.expenses : [];
    if (expenses.length) {
      expenses.forEach((e) => {
        doc.text(`Expense: ${e.label}`, col1, cursorY).text(fmt(e.amount || 0), col2, cursorY, { align: 'right' });
        cursorY += 16;
      });
    } else {
      doc.text('Expenses', col1, cursorY).text(fmt(0), col2, cursorY, { align: 'right' });
      cursorY += 16;
    }

    // Divider
    doc.moveTo(36, cursorY + 4).lineTo(559, cursorY + 4).strokeColor('#cccccc').stroke();
    cursorY += 12;

    // Subtotals / meta
    doc.fillColor('#000000').fontSize(10);
    doc.text('Expenses Total', col1, cursorY).text(fmt(booking.payment?.expensesTotal || 0), col2, cursorY, { align: 'right' });
    cursorY += 16;

    doc.text('Payment Method', col1, cursorY).text((booking.payment?.method || 'cash').toUpperCase(), col2, cursorY, { align: 'right' });
    cursorY += 16;

    // GRAND TOTAL
    doc.font('Helvetica-Bold');
    doc.text('Grand Total', col1, cursorY).text(fmt(booking.payment?.grandTotal || 0), col2, cursorY, { align: 'right' });
    doc.font('Helvetica');
    cursorY += 24;

    // Notes / footer
    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor('#555555')
      .text('Notes:', { underline: true })
      .moveDown(0.2)
      .text(booking.notes || '—')
      .moveDown(1)
      .text('Thank you for choosing FixMate.lk!', { align: 'center' })
      .moveDown(0.2)
      .text('This is a computer-generated receipt and does not require a signature.', { align: 'center' });

    doc.end();
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
