import { Router } from "express";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import {
  createInvoice,
  getAllInvoices,
  getOverdueInvoices,
  getInvoiceById,
  getInvoiceByOrder,
  updateInvoice,
  markInvoicePaid,
  cancelInvoice,
  deleteInvoice,
} from "../controllers/invoice.controller.js";

const router = Router();

// All invoice routes require authentication
router.use(verifyJWT);

// GET /api/v1/invoices/overdue — must be registered before "/:id"
router
  .route("/overdue")
  .get(checkPermission("accounting", "read"), getOverdueInvoices);

// GET /api/v1/invoices/order/:orderId — must be registered before "/:id"
router
  .route("/order/:orderId")
  .get(checkPermission("accounting", "read"), getInvoiceByOrder);

// POST /api/v1/invoices  |  GET /api/v1/invoices
router
  .route("/")
  .post(checkPermission("accounting", "create"), createInvoice)
  .get(checkPermission("accounting", "read"), getAllInvoices);

// PATCH /api/v1/invoices/:id/pay
router
  .route("/:id/pay")
  .patch(checkPermission("accounting", "update"), markInvoicePaid);

// PATCH /api/v1/invoices/:id/cancel
router
  .route("/:id/cancel")
  .patch(checkPermission("accounting", "update"), cancelInvoice);

// GET /api/v1/invoices/:id | PATCH /api/v1/invoices/:id | DELETE /api/v1/invoices/:id
router
  .route("/:id")
  .get(checkPermission("accounting", "read"), getInvoiceById)
  .patch(checkPermission("accounting", "update"), updateInvoice)
  .delete(checkPermission("accounting", "delete"), deleteInvoice);

export default router;