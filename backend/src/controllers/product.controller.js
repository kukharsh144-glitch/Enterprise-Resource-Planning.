import mongoose from "mongoose";
import Product from "../models/Product.model.js";
import Inventory from "../models/Inventory.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

// ─────────────────────────────────────────────
// SECTION 1 — CORE CRUD
// ─────────────────────────────────────────────

/**
 * POST /products
 * Create a new product.
 * Roles: Super Admin, Admin, Manager
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    sku,
    price,
    description,
    image,
    images,
    brand,
    tags,
    unit,
    reorderLevel,
    taxRate,
    discount,
    variants,
    isFeatured,
    isFlashSale,
    flashSalePrice,
    flashSaleEndsAt,
  } = req.body;

  // ── Required field validation ──
  if (!name || !category || !sku || price === undefined) {
    throw new apiError(400, "name, category, sku, and price are required");
  }

  if (typeof price !== "number" || price < 0) {
    throw new apiError(400, "price must be a non-negative number");
  }

  // ── Flash-sale consistency checks ──
  if (isFlashSale) {
    if (!flashSalePrice || flashSalePrice >= price) {
      throw new apiError(
        400,
        "flashSalePrice must be set and must be lower than the regular price"
      );
    }
    if (!flashSaleEndsAt || new Date(flashSaleEndsAt) <= new Date()) {
      throw new apiError(400, "flashSaleEndsAt must be a future date");
    }
  }

  // ── Duplicate SKU check ──
  const skuExists = await Product.findOne({ sku: sku.toUpperCase() });
  if (skuExists) {
    throw new apiError(409, `SKU '${sku}' is already in use`);
  }

  const product = await Product.create({
    name,
    category,
    sku,
    price,
    description: description ?? "",
    image: image ?? "",
    images: images ?? (image ? [image] : []),
    brand: brand ?? "",
    tags: tags ?? [],
    unit: unit ?? "piece",
    reorderLevel: reorderLevel ?? 10,
    taxRate: taxRate ?? 0,
    discount: discount ?? 0,
    variants: variants ?? [],
    isFeatured: isFeatured ?? false,
    isFlashSale: isFlashSale ?? false,
    flashSalePrice: isFlashSale ? flashSalePrice : null,
    flashSaleEndsAt: isFlashSale ? new Date(flashSaleEndsAt) : null,
    createdBy: req.user._id,
    // Seed price history with the opening price
    priceHistory: [{ price, changedAt: new Date(), changedBy: req.user._id }],
  });

  // Automatically create a default inventory record for tracking
  const initialStock = req.body.stock || req.body.quantityInStock || 0;
  await Inventory.create({
    product: product._id,
    warehouse: req.body.warehouse || "Main Warehouse",
    quantityInStock: initialStock,
    reorderLevel: reorderLevel ?? 10,
  });

  await ActivityLog.logActivity({
    actor: req.user._id,
    action: "add_inventory",
    entityType: "Product",
    entityId: product._id,
    details: { sku: product.sku, price: product.price },
    timestamp: new Date(),
  });

  logger.info("Product created", { productId: product._id, sku: product.sku });

  return res
    .status(201)
    .json(new apiResponse(201, product, "Product created successfully"));
});

/**
 * GET /products
 * Amazon-style search & filter with pagination.
 * Public endpoint (no auth required for read).
 *
 * Query params:
 *   q           — full-text / name search
 *   category    — exact category match
 *   brand       — exact brand match
 *   minPrice    — numeric
 *   maxPrice    — numeric
 *   minRating   — 1-5
 *   tags        — comma-separated: "tag1,tag2"
 *   inStock     — "true" | "false"
 *   isFeatured  — "true"
 *   isFlashSale — "true"
 *   sortBy      — price_asc | price_desc | rating | newest | popular
 *   page        — default 1
 *   limit       — default 20, max 100
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    tags,
    inStock,
    isFeatured,
    isFlashSale,
    sortBy = "newest",
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { isActive: { $ne: false } };

  // ── Text search ──
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ];
  }

  // ── Exact filters ──
  if (category) filter.category = { $regex: `^${category}$`, $options: "i" };
  if (brand) filter.brand = { $regex: `^${brand}$`, $options: "i" };

  // ── Price range ──
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  // ── Rating ──
  if (minRating !== undefined) {
    filter["ratings.average"] = { $gte: Number(minRating) };
  }

  // ── Tag filter ──
  if (tags) {
    const tagList = tags.split(",").map((t) => t.trim());
    filter.tags = { $in: tagList };
  }

  // ── Boolean flags ──
  if (isFeatured === "true") filter.isFeatured = true;
  if (isFlashSale === "true") {
    filter.isFlashSale = true;
    filter.flashSaleEndsAt = { $gt: new Date() }; // only live sales
  }

  // ── In-stock filter (requires Inventory lookup) ──
  if (inStock === "true") {
    const stockedProductIds = await Inventory.distinct("product", {
      quantityInStock: { $gt: 0 },
    });
    filter._id = { $in: stockedProductIds };
  }

  // ── Sort ──
  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { "ratings.average": -1 },
    newest: { createdAt: -1 },
    popular: { "ratings.count": -1 },
  };
  const sort = sortMap[sortBy] ?? sortMap.newest;

  // ── Pagination ──
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("-priceHistory -reviews -__v")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  // ── Attach live inventory stock levels ──
  const inventoryMap = await _buildInventoryMap(products.map((p) => p._id));
  const enriched = products.map((p) => ({
    ...p,
    stock: inventoryMap[p._id.toString()] ?? 0,
    effectivePrice: _effectivePrice(p),
  }));

  return res.status(200).json(
    new apiResponse(
      200,
      {
        products: enriched,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      "Products fetched successfully"
    )
  );
});

/**
 * GET /products/:productId
 * Single product detail — full data including reviews & price history.
 * Increments a viewCount for popularity tracking.
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  // Increment view count (fire-and-forget — don't await)
  Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } }).exec();

  const product = await Product.findOne({ _id: productId, isActive: true })
    .populate("createdBy", "username")
    .lean();

  if (!product) {
    throw new apiError(404, "Product not found");
  }

  // Inventory levels across all warehouses
  const inventory = await Inventory.find({ product: productId }).select(
    "warehouse quantityInStock reorderLevel"
  );

  const totalStock = inventory.reduce((s, i) => s + i.quantityInStock, 0);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        ...product,
        inventory,
        totalStock,
        effectivePrice: _effectivePrice(product),
        isLowStock: totalStock > 0 && totalStock <= (product.reorderLevel ?? 10),
        isOutOfStock: totalStock === 0,
      },
      "Product fetched successfully"
    )
  );
});

/**
 * PATCH /products/:productId
 * Partial update. Price changes automatically record a priceHistory entry.
 * Roles: Super Admin, Admin, Manager
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new apiError(404, "Product not found");

  const allowed = [
    "name",
    "category",
    "price",
    "description",
    "brand",
    "image",
    "images",
    "tags",
    "unit",
    "reorderLevel",
    "taxRate",
    "discount",
    "variants",
    "isFeatured",
    "isFlashSale",
    "flashSalePrice",
    "flashSaleEndsAt",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // ── Price-change audit ──
  if (updates.price !== undefined && updates.price !== product.price) {
    if (typeof updates.price !== "number" || updates.price < 0) {
      throw new apiError(400, "price must be a non-negative number");
    }
    product.priceHistory.push({
      price: updates.price,
      changedAt: new Date(),
      changedBy: req.user._id,
    });
  }

  // ── Flash-sale validation ──
  const futureFlashSale =
    updates.isFlashSale ?? product.isFlashSale;
  if (futureFlashSale) {
    const fsp = updates.flashSalePrice ?? product.flashSalePrice;
    const fse = updates.flashSaleEndsAt ?? product.flashSaleEndsAt;
    const basePrice = updates.price ?? product.price;
    if (!fsp || fsp >= basePrice) {
      throw new apiError(400, "flashSalePrice must be lower than the regular price");
    }
    if (!fse || new Date(fse) <= new Date()) {
      throw new apiError(400, "flashSaleEndsAt must be a future date");
    }
  }

  Object.assign(product, updates);
  await product.save();

  if (req.body.stock !== undefined) {
    const stockVal = Math.max(0, Number(req.body.stock));
    await Inventory.findOneAndUpdate(
      { product: product._id },
      { $set: { quantityInStock: stockVal } },
      { upsert: true, new: true }
    );
  }

  await ActivityLog.logActivity({
    actor: req.user._id,
    action: "update_inventory",
    entityType: "Product",
    entityId: product._id,
    details: { updatedFields: Object.keys(updates) },
    timestamp: new Date(),
  });

  logger.info("Product updated", { productId, updatedFields: Object.keys(updates) });

  return res
    .status(200)
    .json(new apiResponse(200, product, "Product updated successfully"));
});

/**
 * DELETE /products/:productId
 * Soft-delete (isActive = false). Hard-delete not exposed.
 * Roles: Super Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new apiError(404, "Product not found");

  product.isActive = false;
  await product.save();

  await ActivityLog.logActivity({
    actor: req.user._id,
    action: "remove_inventory",
    entityType: "Product",
    entityId: product._id,
    details: { sku: product.sku },
    timestamp: new Date(),
  });

  logger.warn("Product soft-deleted", { productId, sku: product.sku });

  return res
    .status(200)
    .json(new apiResponse(200, null, "Product deleted successfully"));
});

// ─────────────────────────────────────────────
// SECTION 2 — AMAZON-STYLE FEATURES
// ─────────────────────────────────────────────

/**
 * GET /products/:productId/related
 * Returns up to `limit` products in the same category (excluding self).
 * Sorted by rating desc so best items surface first — mirrors "Customers
 * also bought" / "Related to this item" on Amazon.
 */
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit ?? 8)));

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true }).select(
    "category tags brand"
  );
  if (!product) throw new apiError(404, "Product not found");

  // Match same category or shared tags, exclude self
  const related = await Product.find({
    _id: { $ne: productId },
    isActive: true,
    $or: [
      { category: product.category },
      { tags: { $in: product.tags ?? [] } },
      { brand: product.brand },
    ],
  })
    .select("-priceHistory -reviews -__v")
    .sort({ "ratings.average": -1, "ratings.count": -1 })
    .limit(limit)
    .lean();

  const inventoryMap = await _buildInventoryMap(related.map((p) => p._id));
  const enriched = related.map((p) => ({
    ...p,
    stock: inventoryMap[p._id.toString()] ?? 0,
    effectivePrice: _effectivePrice(p),
  }));

  return res
    .status(200)
    .json(new apiResponse(200, enriched, "Related products fetched"));
});

/**
 * POST /products/:productId/reviews
 * Submit a rating + review (one per user per product).
 * Auto-recalculates ratings.average and ratings.count on the product.
 */
export const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, body } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  // Validate rating
  const ratingNum = Number(rating);
  if (!rating || ratingNum < 1 || ratingNum > 5) {
    throw new apiError(400, "rating must be between 1 and 5");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new apiError(404, "Product not found");

  // ── One review per user ──
  const alreadyReviewed = product.reviews.some(
    (r) => r.reviewer.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    throw new apiError(409, "You have already reviewed this product");
  }

  product.reviews.push({
    reviewer: req.user._id,
    rating: ratingNum,
    title: title?.trim() ?? "",
    body: body?.trim() ?? "",
    createdAt: new Date(),
    isVerified: false, // set true if user has purchased the item
  });

  // Recompute aggregate rating
  const total = product.reviews.reduce((s, r) => s + r.rating, 0);
  product.ratings = {
    average: parseFloat((total / product.reviews.length).toFixed(1)),
    count: product.reviews.length,
  };

  await product.save();

  return res
    .status(201)
    .json(new apiResponse(201, product.ratings, "Review submitted successfully"));
});

/**
 * GET /products/:productId/reviews
 * Paginated reviews with optional rating filter.
 */
export const getReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("reviews ratings")
    .populate("reviews.reviewer", "username");

  if (!product) throw new apiError(404, "Product not found");

  let reviews = product.reviews;

  // Filter by star rating
  if (rating) {
    const r = Number(rating);
    reviews = reviews.filter((rv) => rv.rating === r);
  }

  // Sort: newest first
  reviews = [...reviews].sort((a, b) => b.createdAt - a.createdAt);

  // Paginate in-memory (reviews are embedded, not a separate collection)
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const total = reviews.length;
  const paginated = reviews.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Star breakdown (Amazon-style histogram)
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  product.reviews.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1; });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        reviews: paginated,
        ratings: product.ratings,
        breakdown,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
      },
      "Reviews fetched successfully"
    )
  );
});

/**
 * GET /products/:productId/price-history
 * Returns the full price-change log — useful for buyers ("Was $99 → Now $69")
 * and internal analytics.
 * Roles: Super Admin, Admin, Manager
 */
export const getPriceHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("name sku price priceHistory")
    .populate("priceHistory.changedBy", "username");

  if (!product) throw new apiError(404, "Product not found");

  return res.status(200).json(
    new apiResponse(
      200,
      {
        productId,
        sku: product.sku,
        currentPrice: product.price,
        history: product.priceHistory.sort((a, b) => b.changedAt - a.changedAt),
      },
      "Price history fetched successfully"
    )
  );
});

/**
 * PATCH /products/:productId/flash-sale
 * Start or end a flash sale on a product.
 * When ended, flashSaleEndsAt is set to now (expired).
 * Roles: Super Admin, Admin, Manager
 */
export const updateFlashSale = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { enable, flashSalePrice, flashSaleEndsAt } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new apiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new apiError(404, "Product not found");

  if (enable) {
    if (!flashSalePrice || Number(flashSalePrice) >= product.price) {
      throw new apiError(400, "flashSalePrice must be set and lower than the regular price");
    }
    if (!flashSaleEndsAt || new Date(flashSaleEndsAt) <= new Date()) {
      throw new apiError(400, "flashSaleEndsAt must be a future date");
    }

    product.isFlashSale = true;
    product.flashSalePrice = Number(flashSalePrice);
    product.flashSaleEndsAt = new Date(flashSaleEndsAt);
  } else {
    // End flash sale
    product.isFlashSale = false;
    product.flashSalePrice = null;
    product.flashSaleEndsAt = null;
  }

  await product.save();

  await ActivityLog.logActivity({
    actor: req.user._id,
    action: "update_inventory",
    entityType: "Product",
    entityId: product._id,
    details: { flashSale: enable ? "started" : "ended" },
    timestamp: new Date(),
  });

  const msg = enable ? "Flash sale started" : "Flash sale ended";
  return res.status(200).json(new apiResponse(200, product, msg));
});

/**
 * GET /products/flash-sales
 * All currently live flash-sale products.
 * Public endpoint.
 */
export const getFlashSaleProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? 20)));

  const products = await Product.find({
    isActive: true,
    isFlashSale: true,
    flashSaleEndsAt: { $gt: new Date() },
  })
    .select("-priceHistory -reviews -__v")
    .sort({ flashSaleEndsAt: 1 }) // soonest ending first (creates urgency)
    .limit(limit)
    .lean();

  const inventoryMap = await _buildInventoryMap(products.map((p) => p._id));
  const enriched = products.map((p) => ({
    ...p,
    stock: inventoryMap[p._id.toString()] ?? 0,
    effectivePrice: _effectivePrice(p),
    discount: Math.round(((p.price - p.flashSalePrice) / p.price) * 100),
    timeLeftMs: p.flashSaleEndsAt - new Date(),
  }));

  return res
    .status(200)
    .json(new apiResponse(200, enriched, "Flash sale products fetched"));
});

/**
 * GET /products/featured
 * Products flagged as isFeatured — used on homepage banners / "Best Sellers".
 * Public endpoint.
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? 12)));

  const products = await Product.find({ isActive: true, isFeatured: true })
    .select("-priceHistory -reviews -__v")
    .sort({ "ratings.average": -1 })
    .limit(limit)
    .lean();

  const inventoryMap = await _buildInventoryMap(products.map((p) => p._id));
  const enriched = products.map((p) => ({
    ...p,
    stock: inventoryMap[p._id.toString()] ?? 0,
    effectivePrice: _effectivePrice(p),
  }));

  return res
    .status(200)
    .json(new apiResponse(200, enriched, "Featured products fetched"));
});

/**
 * GET /products/categories
 * Distinct category list with product counts.
 * Used for sidebar / navigation filters.
 * Public endpoint.
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        avgRating: { $avg: "$ratings.average" },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        category: "$_id",
        count: 1,
        avgPrice: { $round: ["$avgPrice", 2] },
        avgRating: { $round: ["$avgRating", 1] },
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, categories, "Categories fetched successfully"));
});

/**
 * GET /products/low-stock
 * Products where total stock ≤ reorderLevel across all warehouses.
 * Roles: Super Admin, Admin, Manager
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  // Aggregate stock per product across all warehouses
  const stockAgg = await Inventory.aggregate([
    { $group: { _id: "$product", totalStock: { $sum: "$quantityInStock" } } },
  ]);

  // Build a map of productId → totalStock
  const stockMap = {};
  stockAgg.forEach(({ _id, totalStock }) => {
    stockMap[_id.toString()] = totalStock;
  });

  // Fetch all active products, then filter by reorderLevel in-memory
  // (avoids a complex $lookup; acceptable at ERP scale)
  const allProducts = await Product.find({ isActive: true })
    .select("name sku category reorderLevel price")
    .lean();

  const lowStock = allProducts.filter((p) => {
    const stock = stockMap[p._id.toString()] ?? 0;
    return stock <= p.reorderLevel;
  });

  const total = lowStock.length;
  const paginated = lowStock.slice((pageNum - 1) * limitNum, pageNum * limitNum).map((p) => ({
    ...p,
    currentStock: stockMap[p._id.toString()] ?? 0,
    shortage: Math.max(0, p.reorderLevel - (stockMap[p._id.toString()] ?? 0)),
  }));

  return res.status(200).json(
    new apiResponse(
      200,
      {
        products: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      "Low-stock products fetched"
    )
  );
});

// ─────────────────────────────────────────────
// SECTION 3 — ADMIN / BULK OPERATIONS
// ─────────────────────────────────────────────

/**
 * POST /products/bulk-update
 * Update one shared field (e.g. taxRate, discount) across many products at once.
 * Roles: Super Admin, Admin
 */
export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { productIds, updates } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new apiError(400, "productIds array is required and must not be empty");
  }

  if (!updates || typeof updates !== "object") {
    throw new apiError(400, "updates object is required");
  }

  // Whitelist what can be bulk-changed
  const bulkAllowed = ["category", "taxRate", "discount", "isFeatured", "tags", "brand"];
  const sanitized = {};
  for (const key of bulkAllowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  if (Object.keys(sanitized).length === 0) {
    throw new apiError(400, `No valid bulk fields. Allowed: ${bulkAllowed.join(", ")}`);
  }

  // Validate all IDs
  const validIds = productIds.filter((id) => mongoose.isValidObjectId(id));
  if (validIds.length !== productIds.length) {
    throw new apiError(400, "One or more productIds are invalid");
  }

  const result = await Product.updateMany(
    { _id: { $in: validIds }, isActive: true },
    { $set: sanitized }
  );

  await ActivityLog.logActivity({
    actor: req.user._id,
    action: "update_inventory",
    entityType: "Product",
    entityId: null,
    details: {
      productIds: validIds,
      updatedFields: Object.keys(sanitized),
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    },
    timestamp: new Date(),
  });

  logger.info("Bulk update completed", {
    modifiedCount: result.modifiedCount,
    fields: Object.keys(sanitized),
  });

  return res.status(200).json(
    new apiResponse(
      200,
      { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount },
      "Bulk update completed"
    )
  );
});

/**
 * POST /products/bulk-delete
 * Soft-delete multiple products.
 * Roles: Super Admin
 */
export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new apiError(400, "productIds array is required and must not be empty");
  }

  const validIds = productIds.filter((id) => mongoose.isValidObjectId(id));
  if (validIds.length !== productIds.length) {
    throw new apiError(400, "One or more productIds are invalid");
  }

  const result = await Product.updateMany(
    { _id: { $in: validIds }, isActive: true },
    { $set: { isActive: false } }
  );

  await ActivityLog.logActivity({
    actor: req.user._id,
    action: "remove_inventory",
    entityType: "Product",
    entityId: null,
    details: { productIds: validIds, deletedCount: result.modifiedCount },
    timestamp: new Date(),
  });

  logger.warn("Bulk soft-delete", { deletedCount: result.modifiedCount });

  return res.status(200).json(
    new apiResponse(
      200,
      { deletedCount: result.modifiedCount },
      "Products deleted successfully"
    )
  );
});

/**
 * GET /products/analytics
 * Admin-facing analytics — mirrors Amazon Seller Central stats.
 * Roles: Super Admin, Admin, Manager
 */
export const getProductAnalytics = asyncHandler(async (req, res) => {
  const [overview, categoryBreakdown, topRated, mostViewed, recentlyAdded] =
    await Promise.all([
      // Overview stats
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgPrice: { $avg: "$price" },
            avgRating: { $avg: "$ratings.average" },
            totalReviews: { $sum: "$ratings.count" },
            totalViews: { $sum: "$viewCount" },
            featured: { $sum: { $cond: ["$isFeatured", 1, 0] } },
            flashSales: { $sum: { $cond: ["$isFlashSale", 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            avgPrice: { $round: ["$avgPrice", 2] },
            avgRating: { $round: ["$avgRating", 1] },
            totalReviews: 1,
            totalViews: 1,
            featured: 1,
            flashSales: 1,
          },
        },
      ]),

      // Per-category breakdown
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            avgPrice: { $avg: "$price" },
            avgRating: { $avg: "$ratings.average" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
            avgPrice: { $round: ["$avgPrice", 2] },
            avgRating: { $round: ["$avgRating", 1] },
          },
        },
      ]),

      // Top rated
      Product.find({ isActive: true, "ratings.count": { $gte: 1 } })
        .select("name sku price ratings viewCount")
        .sort({ "ratings.average": -1, "ratings.count": -1 })
        .limit(5)
        .lean(),

      // Most viewed
      Product.find({ isActive: true })
        .select("name sku price ratings viewCount")
        .sort({ viewCount: -1 })
        .limit(5)
        .lean(),

      // Recently added
      Product.find({ isActive: true })
        .select("name sku price category createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        overview: overview[0] ?? {},
        categoryBreakdown,
        topRated,
        mostViewed,
        recentlyAdded,
      },
      "Product analytics fetched"
    )
  );
});

// ─────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────

/**
 * Build a productId → totalStock map from the Inventory collection.
 * @param {ObjectId[]} productIds
 * @returns {Object} { "productIdStr": number }
 */
async function _buildInventoryMap(productIds) {
  if (!productIds || productIds.length === 0) return {};

  const stocks = await Inventory.aggregate([
    { $match: { product: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: "$product", total: { $sum: "$quantityInStock" } } },
  ]);

  const map = {};
  stocks.forEach(({ _id, total }) => {
    map[_id.toString()] = total;
  });
  return map;
}

/**
 * Returns flashSalePrice if the sale is active, otherwise price.
 * Used when enriching API responses.
 * @param {Object} product - plain lean product object
 * @returns {number}
 */
function _effectivePrice(product) {
  if (
    product.isFlashSale &&
    product.flashSalePrice != null &&
    product.flashSaleEndsAt &&
    new Date(product.flashSaleEndsAt) > new Date()
  ) {
    return product.flashSalePrice;
  }
  return product.price;
}