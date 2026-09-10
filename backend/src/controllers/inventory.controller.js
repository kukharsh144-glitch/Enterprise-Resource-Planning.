import mongoose from "mongoose";
import Inventory from "../models/Inventory.model.js";
import Product from "../models/Product.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Helper: write an audit log entry without ever breaking the main flow
 */
const logActivity = (req, action, entityId, details = {}) => {
  ActivityLog.logActivity({
    actor: req.user?._id,
    action,
    entityType: "Inventory",
    entityId,
    details,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });
};

/**
 * @desc    Add a new inventory record for a product in a warehouse
 * @route   POST /api/v1/inventory
 * @access  Super Admin, Admin, Manager
 */
export const addInventory = asyncHandler(async (req, res) => {
  const { product, warehouse, quantityInStock, reorderLevel } = req.body;

  if (!product || !warehouse) {
    throw new apiError(400, "Product and warehouse are required");
  }

  if (!mongoose.Types.ObjectId.isValid(product)) {
    throw new apiError(400, "Invalid product id");
  }

  const productExists = await Product.findById(product);
  if (!productExists) {
    throw new apiError(404, "Product not found");
  }

  const existingRecord = await Inventory.findOne({ product, warehouse });
  if (existingRecord) {
    throw new apiError(
      409,
      "Inventory record already exists for this product in this warehouse. Use update or adjust-stock instead."
    );
  }

  const inventory = await Inventory.create({
    product,
    warehouse,
    quantityInStock: quantityInStock ?? 0,
    reorderLevel: reorderLevel ?? 10,
  });

  logActivity(req, "add_inventory", inventory._id, {
    product,
    warehouse,
    quantityInStock: inventory.quantityInStock,
  });

  logger.info("Inventory record created", {
    inventoryId: inventory._id,
    actor: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, inventory, "Inventory record created successfully"));
});

/**
 * @desc    Get all inventory records (with filters + pagination)
 * @route   GET /api/v1/inventory
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getAllInventory = asyncHandler(async (req, res) => {
  const { warehouse, category, lowStock, page = 1, limit = 20 } = req.query;

  const query = {};
  if (warehouse) query.warehouse = warehouse;

  let productFilter = null;
  if (category) {
    productFilter = await Product.find({ category }).select("_id");
    query.product = { $in: productFilter.map((p) => p._id) };
  }

  let inventoryQuery = Inventory.find(query)
    .populate("product", "name sku category price")
    .sort({ updatedAt: -1 });

  if (lowStock === "true") {
    // Filtered in-memory since $expr comparison across fields needs aggregation
    const all = await inventoryQuery;
    const filtered = all.filter((item) => item.quantityInStock <= item.reorderLevel);
    return res
      .status(200)
      .json(new apiResponse(200, filtered, "Low stock inventory fetched successfully"));
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    inventoryQuery.skip(skip).limit(Number(limit)),
    Inventory.countDocuments(query),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        items,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Inventory fetched successfully"
    )
  );
});

/**
 * @desc    Get a single inventory record by id
 * @route   GET /api/v1/inventory/:id
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getInventoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid inventory id");
  }

  const inventory = await Inventory.findById(id).populate(
    "product",
    "name sku category price"
  );

  if (!inventory) {
    throw new apiError(404, "Inventory record not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, inventory, "Inventory record fetched successfully"));
});

/**
 * @desc    Get all inventory records for a given product across warehouses
 * @route   GET /api/v1/inventory/product/:productId
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getInventoryByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new apiError(400, "Invalid product id");
  }

  const records = await Inventory.find({ product: productId }).populate(
    "product",
    "name sku category price"
  );

  return res
    .status(200)
    .json(new apiResponse(200, records, "Product inventory fetched successfully"));
});

/**
 * @desc    Get all items at or below their reorder level
 * @route   GET /api/v1/inventory/low-stock
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await Inventory.find()
    .populate("product", "name sku category price")
    .sort({ warehouse: 1 });

  const lowStock = items.filter((item) => item.quantityInStock <= item.reorderLevel);

  return res
    .status(200)
    .json(new apiResponse(200, lowStock, "Low stock items fetched successfully"));
});

/**
 * @desc    Update an inventory record (warehouse, quantity, reorder level)
 * @route   PATCH /api/v1/inventory/:id
 * @access  Super Admin, Admin, Manager
 */
export const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { warehouse, quantityInStock, reorderLevel } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid inventory id");
  }

  const inventory = await Inventory.findById(id);
  if (!inventory) {
    throw new apiError(404, "Inventory record not found");
  }

  const before = {
    warehouse: inventory.warehouse,
    quantityInStock: inventory.quantityInStock,
    reorderLevel: inventory.reorderLevel,
  };

  if (warehouse !== undefined) inventory.warehouse = warehouse;
  if (quantityInStock !== undefined) {
    if (quantityInStock < 0) {
      throw new apiError(400, "Quantity in stock cannot be negative");
    }
    inventory.quantityInStock = quantityInStock;
  }
  if (reorderLevel !== undefined) {
    if (reorderLevel < 0) {
      throw new apiError(400, "Reorder level cannot be negative");
    }
    inventory.reorderLevel = reorderLevel;
  }

  await inventory.save();

  logActivity(req, "update_inventory", inventory._id, {
    before,
    after: {
      warehouse: inventory.warehouse,
      quantityInStock: inventory.quantityInStock,
      reorderLevel: inventory.reorderLevel,
    },
  });

  return res
    .status(200)
    .json(new apiResponse(200, inventory, "Inventory record updated successfully"));
});

/**
 * @desc    Adjust stock quantity by a relative amount (+ve for receipt, -ve for consumption)
 * @route   PATCH /api/v1/inventory/:id/adjust-stock
 * @access  Super Admin, Admin, Manager
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adjustment, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid inventory id");
  }

  if (adjustment === undefined || Number.isNaN(Number(adjustment))) {
    throw new apiError(400, "A numeric adjustment value is required");
  }

  const inventory = await Inventory.findById(id);
  if (!inventory) {
    throw new apiError(404, "Inventory record not found");
  }

  const newQuantity = inventory.quantityInStock + Number(adjustment);
  if (newQuantity < 0) {
    throw new apiError(
      400,
      `Adjustment would result in negative stock. Current stock: ${inventory.quantityInStock}`
    );
  }

  const previousQuantity = inventory.quantityInStock;
  inventory.quantityInStock = newQuantity;
  await inventory.save();

  logActivity(req, "update_inventory", inventory._id, {
    previousQuantity,
    adjustment: Number(adjustment),
    newQuantity,
    reason: reason || "Not specified",
  });

  if (inventory.quantityInStock <= inventory.reorderLevel) {
    logger.warn("Inventory below reorder level", {
      inventoryId: inventory._id,
      product: inventory.product,
      warehouse: inventory.warehouse,
      quantityInStock: inventory.quantityInStock,
      reorderLevel: inventory.reorderLevel,
    });
  }

  return res
    .status(200)
    .json(new apiResponse(200, inventory, "Stock adjusted successfully"));
});

/**
 * @desc    Delete an inventory record
 * @route   DELETE /api/v1/inventory/:id
 * @access  Super Admin
 */
export const deleteInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid inventory id");
  }

  const inventory = await Inventory.findByIdAndDelete(id);
  if (!inventory) {
    throw new apiError(404, "Inventory record not found");
  }

  logActivity(req, "remove_inventory", inventory._id, {
    product: inventory.product,
    warehouse: inventory.warehouse,
    quantityAtDeletion: inventory.quantityInStock,
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Inventory record deleted successfully"));
});