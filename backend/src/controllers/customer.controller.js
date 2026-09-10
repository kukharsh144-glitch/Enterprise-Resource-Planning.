import mongoose from "mongoose";
import Customer from "../models/Customer.model.js";
import Order from "../models/Order.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

/**
 * NOTE ON AUDIT LOGGING: ActivityLog.entityType has no "Customer" value
 * (and there's no "create_customer" / "update_customer" / "delete_customer"
 * action either), so customer changes are intentionally not written to
 * ActivityLog below. Add "Customer" to entityType and the matching actions
 * there first if this needs to be audited like other entities.
 */

/**
 * @desc    Create a new customer
 * @route   POST /api/v1/customers
 * @access  Super Admin, Admin, Manager
 */
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email || !phone || !address) {
    throw new apiError(400, "Name, email, phone, and address are all required");
  }

  const existing = await Customer.findOne({
    $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
  });

  if (existing) {
    throw new apiError(
      409,
      existing.email === email.toLowerCase().trim()
        ? "A customer with this email already exists"
        : "A customer with this phone number already exists"
    );
  }

  const customer = await Customer.create({ name, email, phone, address });

  logger.info("Customer created", {
    customerId: customer._id,
    actor: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, customer, "Customer created successfully"));
});

/**
 * @desc    Get all customers (search + pagination)
 * @route   GET /api/v1/customers
 * @access  Super Admin, Admin, Manager, Accountant
 */
export const getAllCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(query),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        customers,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Customers fetched successfully"
    )
  );
});

/**
 * @desc    Get a single customer by id
 * @route   GET /api/v1/customers/:id
 * @access  Super Admin, Admin, Manager, Accountant
 */
export const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid customer id");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new apiError(404, "Customer not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, customer, "Customer fetched successfully"));
});

/**
 * @desc    Get a customer's order history
 * @route   GET /api/v1/customers/:id/orders
 * @access  Super Admin, Admin, Manager, Accountant
 */
export const getCustomerOrders = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid customer id");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new apiError(404, "Customer not found");
  }

  const orders = await Order.find({ customer: id })
    .populate("items.product", "name sku category")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new apiResponse(200, orders, "Customer order history fetched successfully"));
});

/**
 * @desc    Update a customer's details
 * @route   PATCH /api/v1/customers/:id
 * @access  Super Admin, Admin, Manager
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid customer id");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new apiError(404, "Customer not found");
  }

  // Guard against colliding with another customer's unique email/phone
  if (email && email.toLowerCase().trim() !== customer.email) {
    const emailTaken = await Customer.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: id },
    });
    if (emailTaken) {
      throw new apiError(409, "A customer with this email already exists");
    }
  }

  if (phone && phone.trim() !== customer.phone) {
    const phoneTaken = await Customer.findOne({
      phone: phone.trim(),
      _id: { $ne: id },
    });
    if (phoneTaken) {
      throw new apiError(409, "A customer with this phone number already exists");
    }
  }

  if (name !== undefined) customer.name = name;
  if (email !== undefined) customer.email = email;
  if (phone !== undefined) customer.phone = phone;
  if (address !== undefined) customer.address = address;

  await customer.save();

  return res
    .status(200)
    .json(new apiResponse(200, customer, "Customer updated successfully"));
});

/**
 * @desc    Delete a customer (blocked if they have any orders on record)
 * @route   DELETE /api/v1/customers/:id
 * @access  Super Admin
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid customer id");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new apiError(404, "Customer not found");
  }

  const orderCount = await Order.countDocuments({ customer: id });
  if (orderCount > 0) {
    throw new apiError(
      409,
      `Cannot delete customer with ${orderCount} order(s) on record. Remove or reassign their orders first.`
    );
  }

  await Customer.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Customer deleted successfully"));
});