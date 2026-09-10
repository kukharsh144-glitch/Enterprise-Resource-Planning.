import { Router } from "express";
import {
  // Core CRUD
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,

  // Amazon-style features
  getRelatedProducts,
  addReview,
  getReviews,
  getPriceHistory,
  updateFlashSale,
  getFlashSaleProducts,
  getFeaturedProducts,
  getCategories,

  // Low stock
  getLowStockProducts,

  // Admin/Bulk operations
  bulkUpdateProducts,
  bulkDeleteProducts,

  // Analytics
  getProductAnalytics,
} from "../controllers/product.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/auth.middleware.js";
import { sanitizeInput } from "../middlewares/auth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// PUBLIC ENDPOINTS (no authentication required)
// ─────────────────────────────────────────────

/**
 * GET /products
 * Fetch products with filters, search, and pagination
 * Query: q, category, brand, minPrice, maxPrice, minRating, tags, inStock, isFeatured, isFlashSale, sortBy, page, limit
 */
router.get("/", getProducts);

/**
 * GET /products/:productId
 * Get single product details with inventory levels
 */
router.get("/:productId", getProductById);

/**
 * GET /products/:productId/reviews
 * Fetch paginated reviews for a product with star breakdown
 * Query: rating (1-5), page, limit
 */
router.get("/:productId/reviews", getReviews);

/**
 * GET /products/:productId/related
 * Get related products in same category/tags
 * Query: limit (default 8, max 20)
 */
router.get("/:productId/related", getRelatedProducts);

/**
 * GET /products/flash-sales
 * List all active flash sale products
 * Query: limit (default 20, max 50)
 */
router.get("/flash-sales/list", getFlashSaleProducts);

/**
 * GET /products/featured
 * List all featured products (homepage banners)
 * Query: limit (default 12, max 50)
 */
router.get("/featured/list", getFeaturedProducts);

/**
 * GET /products/categories
 * Get distinct categories with product counts and stats
 */
router.get("/categories/list", getCategories);

// ─────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS (require JWT)
// ─────────────────────────────────────────────

/**
 * POST /products/:productId/reviews
 * Submit a rating and review for a product
 * Auth: Any authenticated user
 * Body: { rating: 1-5, title?, body? }
 */
router.post("/:productId/reviews", verifyJWT, sanitizeInput, addReview);

// ─────────────────────────────────────────────
// ADMIN ENDPOINTS (require roles & permissions)
// ─────────────────────────────────────────────

/**
 * POST /products
 * Create a new product
 * Auth: Super Admin, Admin, Manager
 * Body: { name, category, sku, price, description?, brand?, tags?, ... }
 */
router.post(
  "/",
  verifyJWT,
  sanitizeInput,
  checkPermission("projects", "create"), // uses existing permission check
  createProduct
);

/**
 * PATCH /products/:productId
 * Update product fields (name, category, price, etc.)
 * Auth: Super Admin, Admin, Manager
 * Body: partial product object
 */
router.patch(
  "/:productId",
  verifyJWT,
  sanitizeInput,
  checkPermission("projects", "update"),
  updateProduct
);

/**
 * DELETE /products/:productId
 * Soft-delete a product (mark isActive = false)
 * Auth: Super Admin only
 */
router.delete(
  "/:productId",
  verifyJWT,
  checkPermission("projects", "delete"),
  deleteProduct
);

/**
 * GET /products/:productId/price-history
 * View full price change log for a product
 * Auth: Super Admin, Admin, Manager
 */
router.get(
  "/:productId/price-history",
  verifyJWT,
  checkPermission("projects", "read"),
  getPriceHistory
);

/**
 * PATCH /products/:productId/flash-sale
 * Start or end a flash sale on a product
 * Auth: Super Admin, Admin, Manager
 * Body: { enable: boolean, flashSalePrice?, flashSaleEndsAt? }
 */
router.patch(
  "/:productId/flash-sale",
  verifyJWT,
  sanitizeInput,
  checkPermission("projects", "update"),
  updateFlashSale
);

/**
 * GET /products/low-stock
 * List products below reorder level (requires warehouse stock aggregation)
 * Auth: Super Admin, Admin, Manager
 * Query: page, limit
 */
router.get(
  "/low-stock/list",
  verifyJWT,
  checkPermission("projects", "read"),
  getLowStockProducts
);

/**
 * GET /products/analytics
 * Get product analytics dashboard (Seller Central-style)
 * Auth: Super Admin, Admin, Manager
 */
router.get(
  "/analytics/dashboard",
  verifyJWT,
  checkPermission("projects", "read"),
  getProductAnalytics
);

/**
 * POST /products/bulk-update
 * Update multiple products at once (shared fields only)
 * Auth: Super Admin, Admin
 * Body: { productIds: [id1, id2, ...], updates: { category?, taxRate?, discount?, ... } }
 */
router.post(
  "/bulk-update",
  verifyJWT,
  sanitizeInput,
  checkPermission("projects", "update"),
  bulkUpdateProducts
);

/**
 * POST /products/bulk-delete
 * Soft-delete multiple products
 * Auth: Super Admin only
 * Body: { productIds: [id1, id2, ...] }
 */
router.post(
  "/bulk-delete",
  verifyJWT,
  checkPermission("projects", "delete"),
  bulkDeleteProducts
);

export default router;