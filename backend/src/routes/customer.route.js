import { Router } from "express";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

const router = Router();

// All customer routes require authentication
router.use(verifyJWT);

// POST /api/v1/customers  |  GET /api/v1/customers
router
  .route("/")
  .post(checkPermission("sales", "create"), createCustomer)
  .get(checkPermission("sales", "read"), getAllCustomers);

// GET /api/v1/customers/:id/orders
router
  .route("/:id/orders")
  .get(checkPermission("sales", "read"), getCustomerOrders);

// GET /api/v1/customers/:id | PATCH /api/v1/customers/:id | DELETE /api/v1/customers/:id
router
  .route("/:id")
  .get(checkPermission("sales", "read"), getCustomerById)
  .patch(checkPermission("sales", "update"), updateCustomer)
  .delete(checkPermission("sales", "delete"), deleteCustomer);

export default router;