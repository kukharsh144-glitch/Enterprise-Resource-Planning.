import mongoose from "mongoose";
import Invoice from "../models/Invoice.model.js";
import Order from "../models/Order.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Helper: write an audit log entry without ever breaking the main flow.
 * NOTE: ActivityLog.action only has "create_invoice" for invoices today —
 * there's no enum value for marking one paid/cancelled or deleting it, so
 * those transitions are intentionally left unlogged below rather than
 * passed to logActivity, where an invalid value would just fail schema
 * validation silently. Extend the enum first if those need auditing too.
 */
const logActivity = (req, action, entityId, details = {}) => {
  ActivityLog.logActivity({
    actor: req.user?._id,
    action,
    entityType: "Invoice",
    entityId,
    details,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });
};

/**
 * Generate a reasonably unique, human-readable invoice number
 * Format: INV-YYYYMMDD-XXXXX
 */
const generateInvoiceNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `INV-${datePart}-${randomPart}`;
};

/**
 * @desc    Create an invoice for an order
 * @route   POST /api/v1/invoices
 * @access  Super Admin, Admin, Accountant
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const { order, amount, dueDate } = req.body;

  if (!order || !mongoose.Types.ObjectId.isValid(order)) {
    throw new apiError(400, "A valid order id is required");
  }

  if (!dueDate) {
    throw new apiError(400, "Due date is required");
  }

  const orderDoc = await Order.findById(order);
  if (!orderDoc) {
    throw new apiError(404, "Order not found");
  }

  if (orderDoc.status === "pending" || orderDoc.status === "cancelled") {
    throw new apiError(
      400,
      `Cannot invoice an order with status "${orderDoc.status}". The order must be placed or delivered first.`
    );
  }

  const existingInvoice = await Invoice.findOne({ order });
  if (existingInvoice) {
    throw new apiError(409, "An invoice already exists for this order");
  }

  const invoice = await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    order,
    amount: amount ?? orderDoc.totalAmount,
    dueDate,
    status: "Pending",
  });

  logActivity(req, "create_invoice", invoice._id, {
    invoiceNumber: invoice.invoiceNumber,
    order,
    amount: invoice.amount,
  });

  logger.info("Invoice created", {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    actor: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, invoice, "Invoice created successfully"));
});

/**
 * @desc    Get all invoices (filters + pagination)
 * @route   GET /api/v1/invoices
 * @access  Super Admin, Admin, Accountant
 */
export const getAllInvoices = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate({
        path: "order",
        select: "orderNumber customer totalAmount status",
        populate: { path: "customer", select: "name email phone" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(query),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        invoices,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Invoices fetched successfully"
    )
  );
});

/**
 * @desc    Get invoices that are past due and still unpaid
 * @route   GET /api/v1/invoices/overdue
 * @access  Super Admin, Admin, Accountant
 */
export const getOverdueInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    status: "Pending",
    dueDate: { $lt: new Date() },
  })
    .populate({
      path: "order",
      select: "orderNumber customer totalAmount",
      populate: { path: "customer", select: "name email phone" },
    })
    .sort({ dueDate: 1 });

  return res
    .status(200)
    .json(new apiResponse(200, invoices, "Overdue invoices fetched successfully"));
});

/**
 * @desc    Get a single invoice by id
 * @route   GET /api/v1/invoices/:id
 * @access  Super Admin, Admin, Accountant
 */
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid invoice id");
  }

  const invoice = await Invoice.findById(id).populate({
    path: "order",
    select: "orderNumber customer items totalAmount status",
    populate: [
      { path: "customer", select: "name email phone address" },
      { path: "items.product", select: "name sku category" },
    ],
  });

  if (!invoice) {
    throw new apiError(404, "Invoice not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, invoice, "Invoice fetched successfully"));
});

/**
 * @desc    Get the invoice for a given order (if one exists)
 * @route   GET /api/v1/invoices/order/:orderId
 * @access  Super Admin, Admin, Accountant
 */
export const getInvoiceByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new apiError(400, "Invalid order id");
  }

  const invoice = await Invoice.findOne({ order: orderId }).populate(
    "order",
    "orderNumber customer totalAmount status"
  );

  if (!invoice) {
    throw new apiError(404, "No invoice found for this order");
  }

  return res
    .status(200)
    .json(new apiResponse(200, invoice, "Invoice fetched successfully"));
});

/**
 * @desc    Update an invoice's amount or due date (only while still pending)
 * @route   PATCH /api/v1/invoices/:id
 * @access  Super Admin, Admin, Accountant
 */
export const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, dueDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid invoice id");
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new apiError(404, "Invoice not found");
  }

  if (invoice.status !== "Pending") {
    throw new apiError(
      400,
      `Cannot modify an invoice with status "${invoice.status}"`
    );
  }

  if (amount !== undefined) {
    if (amount < 0) {
      throw new apiError(400, "Amount cannot be negative");
    }
    invoice.amount = amount;
  }
  if (dueDate !== undefined) invoice.dueDate = dueDate;

  await invoice.save();

  return res
    .status(200)
    .json(new apiResponse(200, invoice, "Invoice updated successfully"));
});

/**
 * @desc    Mark an invoice as paid
 * @route   PATCH /api/v1/invoices/:id/pay
 * @access  Super Admin, Admin, Accountant
 */
export const markInvoicePaid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid invoice id");
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new apiError(404, "Invoice not found");
  }

  if (invoice.status !== "Pending") {
    throw new apiError(
      400,
      `Only pending invoices can be marked paid. Current status: "${invoice.status}"`
    );
  }

  invoice.status = "Paid";
  await invoice.save();

  // Not written to ActivityLog: no "pay_invoice" action exists in the
  // schema's enum yet. Add one there first if this needs auditing.

  return res
    .status(200)
    .json(new apiResponse(200, invoice, "Invoice marked as paid"));
});

/**
 * @desc    Cancel a pending invoice
 * @route   PATCH /api/v1/invoices/:id/cancel
 * @access  Super Admin, Admin, Accountant
 */
export const cancelInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid invoice id");
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new apiError(404, "Invoice not found");
  }

  if (invoice.status !== "Pending") {
    throw new apiError(
      400,
      `Only pending invoices can be cancelled. Current status: "${invoice.status}"`
    );
  }

  invoice.status = "Cancelled";
  await invoice.save();

  return res
    .status(200)
    .json(new apiResponse(200, invoice, "Invoice cancelled successfully"));
});

/**
 * @desc    Permanently delete an invoice (only while still pending)
 * @route   DELETE /api/v1/invoices/:id
 * @access  Super Admin
 */
export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid invoice id");
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new apiError(404, "Invoice not found");
  }

  if (invoice.status !== "Pending") {
    throw new apiError(
      400,
      `Only pending invoices can be deleted. Cancel it instead if it has status "${invoice.status}".`
    );
  }

  await Invoice.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Invoice deleted successfully"));
});