import mongoose from "mongoose";
import Supplier from "../models/Supplier.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

/**
 * NOTE ON AUDIT LOGGING: ActivityLog.entityType has no "Supplier" value
 * (and there's no "create_supplier" / "update_supplier" / "delete_supplier"
 * action either), so supplier changes are intentionally not written to
 * ActivityLog below. Add "Supplier" to entityType and the matching actions
 * there first if this needs to be audited like other entities.
 *
 * NOTE ON PERMISSIONS: checkPermission() has no dedicated "purchase" module
 * yet even though ActivityLog already has purchase-order actions
 * (create_po, approve_po, reject_po, receive_goods). Suppliers are gated
 * under the existing "inventory" module below — swap this out once a
 * "purchase" permission module is added.
 */

/**
 * @desc    Create a new supplier
 * @route   POST /api/v1/suppliers
 * @access  Super Admin, Admin, Manager
 */
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;

  if (!name || !contactPerson || !email || !phone) {
    throw new apiError(
      400,
      "Name, contact person, email, and phone are all required"
    );
  }

  const existing = await Supplier.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new apiError(409, "A supplier with this email already exists");
  }

  const supplier = await Supplier.create({
    name,
    contactPerson,
    email,
    phone,
    address,
  });

  logger.info("Supplier created", {
    supplierId: supplier._id,
    actor: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, supplier, "Supplier created successfully"));
});

/**
 * @desc    Get all suppliers (search + pagination)
 * @route   GET /api/v1/suppliers
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getAllSuppliers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [
      { name: regex },
      { contactPerson: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [suppliers, total] = await Promise.all([
    Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(query),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        suppliers,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Suppliers fetched successfully"
    )
  );
});

/**
 * @desc    Get a single supplier by id
 * @route   GET /api/v1/suppliers/:id
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid supplier id");
  }

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new apiError(404, "Supplier not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, supplier, "Supplier fetched successfully"));
});

/**
 * @desc    Update a supplier's details
 * @route   PATCH /api/v1/suppliers/:id
 * @access  Super Admin, Admin, Manager
 */
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, email, phone, address } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid supplier id");
  }

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new apiError(404, "Supplier not found");
  }

  // Guard against colliding with another supplier's unique email
  if (email && email.toLowerCase().trim() !== supplier.email) {
    const emailTaken = await Supplier.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: id },
    });
    if (emailTaken) {
      throw new apiError(409, "A supplier with this email already exists");
    }
  }

  if (name !== undefined) supplier.name = name;
  if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
  if (email !== undefined) supplier.email = email;
  if (phone !== undefined) supplier.phone = phone;
  if (address !== undefined) supplier.address = address;

  await supplier.save();

  return res
    .status(200)
    .json(new apiResponse(200, supplier, "Supplier updated successfully"));
});

/**
 * @desc    Delete a supplier
 * @route   DELETE /api/v1/suppliers/:id
 * @access  Super Admin
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid supplier id");
  }

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new apiError(404, "Supplier not found");
  }

  // NOTE: once a PurchaseOrder model exists, add a check here (similar to
  // the order-count guard in customer.controller.js) to block deletion of
  // suppliers that still have purchase orders on record.

  await Supplier.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Supplier deleted successfully"));
});