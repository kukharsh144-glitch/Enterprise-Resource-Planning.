import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Customer from "../models/Customer.model.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Helper: write an audit log entry without ever breaking the main flow.
 * NOTE: ActivityLog.action is a strict enum. Only "create_sales_order",
 * "confirm_sales_order" and "cancel_sales_order" exist for orders today —
 * transitions like "delivered" or a plain item edit have no matching
 * enum value yet, so those are intentionally left unlogged below rather
 * than passed to logActivity, where they'd silently fail schema validation.
 */
const logActivity = (req, action, entityId, details = {}) => {
  ActivityLog.logActivity({
    actor: req.user?._id,
    action,
    entityType: "SalesOrder",
    entityId,
    details,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });
};

/**
 * Generate a reasonably unique, human-readable order number
 * Format: ORD-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${datePart}-${randomPart}`;
};

/**
 * @desc    Create a new sales order
 * @route   POST /api/v1/orders
 * @access  Super Admin, Admin, Manager
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items } = req.body;

  if (!customer || !mongoose.Types.ObjectId.isValid(customer)) {
    throw new apiError(400, "A valid customer id is required");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new apiError(400, "Order must contain at least one item");
  }

  const customerExists = await Customer.findById(customer);
  if (!customerExists) {
    throw new apiError(404, "Customer not found");
  }

  // Check if customer email matches an active employee/user account
  const matchedUser = await User.findOne({
    email: customerExists.email.toLowerCase().trim(),
    isActive: true,
  });

  const isEmployee = !!matchedUser;
  const discountPercent = isEmployee ? 15 : 0; // 15% employee discount

  // Validate every referenced product exists and normalize line items
  const productIds = items.map((item) => item.product);
  if (productIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new apiError(400, "One or more item product ids are invalid");
  }

  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== new Set(productIds.map(String)).size) {
    throw new apiError(404, "One or more products in the order were not found");
  }

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const normalizedItems = items.map((item) => {
    if (!item.quantity || item.quantity < 1) {
      throw new apiError(400, "Each item requires a quantity of at least 1");
    }
    const product = productMap.get(String(item.product));
    const basePrice = item.unitPrice ?? product.price;
    const unitPrice = isEmployee
      ? Number((basePrice * (1 - discountPercent / 100)).toFixed(2))
      : basePrice;

    return {
      product: item.product,
      quantity: item.quantity,
      unitPrice,
    };
  });

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer,
    items: normalizedItems,
    status: "pending",
    isEmployeeOrder: isEmployee,
    discountPercentApplied: discountPercent,
  });

  logActivity(req, "create_sales_order", order._id, {
    orderNumber: order.orderNumber,
    customer,
    itemCount: normalizedItems.length,
    totalAmount: order.totalAmount,
  });

  logger.info("Sales order created", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    actor: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, order, "Order created successfully"));
});

/**
 * @desc    Get all orders (filters + pagination)
 * @route   GET /api/v1/orders
 * @access  Super Admin, Admin, Manager, Accountant
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, customer, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (customer) {
    if (!mongoose.Types.ObjectId.isValid(customer)) {
      throw new apiError(400, "Invalid customer id");
    }
    query.customer = customer;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("customer", "name email phone")
      .populate("items.product", "name sku category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Orders fetched successfully"
    )
  );
});

/**
 * @desc    Get a single order by id
 * @route   GET /api/v1/orders/:id
 * @access  Super Admin, Admin, Manager, Accountant
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid order id");
  }

  const order = await Order.findById(id)
    .populate("customer", "name email phone address")
    .populate("items.product", "name sku category price");

  if (!order) {
    throw new apiError(404, "Order not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, order, "Order fetched successfully"));
});

/**
 * @desc    Get all orders placed by a specific customer
 * @route   GET /api/v1/orders/customer/:customerId
 * @access  Super Admin, Admin, Manager, Accountant
 */
export const getOrdersByCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new apiError(400, "Invalid customer id");
  }

  const orders = await Order.find({ customer: customerId })
    .populate("items.product", "name sku category")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new apiResponse(200, orders, "Customer orders fetched successfully"));
});

/**
 * @desc    Update line items on an order (only while still pending)
 * @route   PATCH /api/v1/orders/:id
 * @access  Super Admin, Admin, Manager
 */
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  if (order.status !== "pending") {
    throw new apiError(
      400,
      `Cannot modify items on an order with status "${order.status}"`
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new apiError(400, "Order must contain at least one item");
  }

  const productIds = items.map((item) => item.product);
  if (productIds.some((pid) => !mongoose.Types.ObjectId.isValid(pid))) {
    throw new apiError(400, "One or more item product ids are invalid");
  }

  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== new Set(productIds.map(String)).size) {
    throw new apiError(404, "One or more products in the order were not found");
  }
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  order.items = items.map((item) => {
    if (!item.quantity || item.quantity < 1) {
      throw new apiError(400, "Each item requires a quantity of at least 1");
    }
    const product = productMap.get(String(item.product));
    return {
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? product.price,
    };
  });

  // totalAmount is recalculated automatically by the model's pre-save hook
  await order.save();

  return res
    .status(200)
    .json(new apiResponse(200, order, "Order updated successfully"));
});

/**
 * @desc    Confirm/place a pending order
 * @route   PATCH /api/v1/orders/:id/confirm
 * @access  Super Admin, Admin, Manager
 */
export const confirmOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  if (order.status !== "pending") {
    throw new apiError(
      400,
      `Only pending orders can be confirmed. Current status: "${order.status}"`
    );
  }

  order.status = "placed";
  await order.save();

  logActivity(req, "confirm_sales_order", order._id, {
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
  });

  return res
    .status(200)
    .json(new apiResponse(200, order, "Order confirmed successfully"));
});

/**
 * @desc    Mark a placed order as delivered
 * @route   PATCH /api/v1/orders/:id/deliver
 * @access  Super Admin, Admin, Manager
 */
export const deliverOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  if (order.status !== "placed") {
    throw new apiError(
      400,
      `Only placed orders can be marked delivered. Current status: "${order.status}"`
    );
  }

  order.status = "delivered";
  await order.save();

  // Not written to ActivityLog: no "deliver_sales_order" action exists in
  // the schema's enum yet. Add one there first if this needs auditing.

  return res
    .status(200)
    .json(new apiResponse(200, order, "Order marked as delivered"));
});

/**
 * @desc    Cancel an order (pending or placed; not once delivered)
 * @route   PATCH /api/v1/orders/:id/cancel
 * @access  Super Admin, Admin, Manager
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  if (order.status === "delivered" || order.status === "cancelled") {
    throw new apiError(
      400,
      `Cannot cancel an order with status "${order.status}"`
    );
  }

  order.status = "cancelled";
  await order.save();

  logActivity(req, "cancel_sales_order", order._id, {
    orderNumber: order.orderNumber,
    reason: reason || "Not specified",
  });

  return res
    .status(200)
    .json(new apiResponse(200, order, "Order cancelled successfully"));
});

/**
 * @desc    Permanently delete an order (only while still pending)
 * @route   DELETE /api/v1/orders/:id
 * @access  Super Admin
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid order id");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  if (order.status !== "pending") {
    throw new apiError(
      400,
      `Only pending orders can be deleted. Cancel it instead if it has status "${order.status}".`
    );
  }

  await Order.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Order deleted successfully"));
});