import { Router } from "express";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller.js";

const router = Router();

// All supplier routes require authentication
router.use(verifyJWT);

// POST /api/v1/suppliers  |  GET /api/v1/suppliers
router
  .route("/")
  .post(checkPermission("inventory", "create"), createSupplier)
  .get(checkPermission("inventory", "read"), getAllSuppliers);

// GET /api/v1/suppliers/:id | PATCH /api/v1/suppliers/:id | DELETE /api/v1/suppliers/:id
router
  .route("/:id")
  .get(checkPermission("inventory", "read"), getSupplierById)
  .patch(checkPermission("inventory", "update"), updateSupplier)
  .delete(checkPermission("inventory", "delete"), deleteSupplier);

export default router;