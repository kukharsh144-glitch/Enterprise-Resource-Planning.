import { Router } from "express";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  updateOrder,
  confirmOrder,
  deliverOrder,
  cancelOrder,
  deleteOrder,
} from "../controllers/order.controller.js";

const router = Router();

// All order routes require authentication
router.use(verifyJWT);

// GET /api/v1/orders/customer/:customerId — must be registered before "/:id"
router
  .route("/customer/:customerId")
  .get(checkPermission("sales", "read"), getOrdersByCustomer);

// POST /api/v1/orders  |  GET /api/v1/orders
router
  .route("/")
  .post(checkPermission("sales", "create"), createOrder)
  .get(checkPermission("sales", "read"), getAllOrders);

// PATCH /api/v1/orders/:id/confirm
router.route("/:id/confirm").patch(checkPermission("sales", "update"), confirmOrder);

// PATCH /api/v1/orders/:id/deliver
router.route("/:id/deliver").patch(checkPermission("sales", "update"), deliverOrder);

// PATCH /api/v1/orders/:id/cancel
router.route("/:id/cancel").patch(checkPermission("sales", "update"), cancelOrder);

// GET /api/v1/orders/:id | PATCH /api/v1/orders/:id | DELETE /api/v1/orders/:id
router
  .route("/:id")
  .get(checkPermission("sales", "read"), getOrderById)
  .patch(checkPermission("sales", "update"), updateOrder)
  .delete(checkPermission("sales", "delete"), deleteOrder);

export default router;