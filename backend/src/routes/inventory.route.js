import { Router } from "express";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import {
  addInventory,
  getAllInventory,
  getInventoryById,
  getInventoryByProduct,
  getLowStockItems,
  updateInventory,
  adjustStock,
  deleteInventory,
} from "../controllers/inventory.controller.js";

const router = Router();

// All inventory routes require authentication
router.use(verifyJWT);

// GET /api/v1/inventory/low-stock  — must be registered before "/:id"
router.route("/low-stock").get(checkPermission("inventory", "read"), getLowStockItems);

// GET /api/v1/inventory/product/:productId
router
  .route("/product/:productId")
  .get(checkPermission("inventory", "read"), getInventoryByProduct);

// POST /api/v1/inventory  |  GET /api/v1/inventory
router
  .route("/")
  .post(checkPermission("inventory", "create"), addInventory)
  .get(checkPermission("inventory", "read"), getAllInventory);

// PATCH /api/v1/inventory/:id/adjust-stock
router
  .route("/:id/adjust-stock")
  .patch(checkPermission("inventory", "update"), adjustStock);

// GET /api/v1/inventory/:id | PATCH /api/v1/inventory/:id | DELETE /api/v1/inventory/:id
router
  .route("/:id")
  .get(checkPermission("inventory", "read"), getInventoryById)
  .patch(checkPermission("inventory", "update"), updateInventory)
  .delete(checkPermission("inventory", "delete"), deleteInventory);

export default router;