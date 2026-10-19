import { Router } from "express";
import {
  getPayrollHistory,
  getPayrollById,
  runPayroll,
  updatePayroll,
  submitPayroll,
  approvePayroll,
  rejectPayroll,
  processPayroll,
  markPayrollAsPaid,
  getPayrollStatistics,
  updatePayrollStatus,
} from "../controllers/payroll.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Stats overview (must be placed before /:id)
router.get("/stats/overview", authorize(["Super Admin", "Admin", "HR", "Accountant"]), getPayrollStatistics);

// Get Payroll History
router.get("/", authorize(["Super Admin", "Admin", "HR", "Accountant"]), getPayrollHistory);

// Run Payroll
router.post("/run", authorize(["Super Admin", "Admin", "HR"]), runPayroll);

// Process batch payroll
router.post("/process", authorize(["Super Admin", "Admin", "Accountant"]), processPayroll);

// Status update endpoints (PUT/PATCH for frontend compatibility)
router.put("/:id/status", authorize(["Super Admin", "Admin", "HR", "Accountant"]), updatePayrollStatus);
router.patch("/:id/status", authorize(["Super Admin", "Admin", "HR", "Accountant"]), updatePayrollStatus);

// Get specific record
router.get("/:id", authorize(["Super Admin", "Admin", "HR", "Accountant"]), getPayrollById);

// Operations on specific payroll records
router.put("/:id", authorize(["Super Admin", "Admin", "HR"]), updatePayroll);
router.post("/:id/submit", authorize(["Super Admin", "Admin", "HR"]), submitPayroll);
router.post("/:id/approve", authorize(["Super Admin", "Admin", "HR", "Accountant"]), approvePayroll);
router.post("/:id/reject", authorize(["Super Admin", "Admin", "HR", "Accountant"]), rejectPayroll);
router.post("/:id/process", authorize(["Super Admin", "Admin", "Accountant"]), processPayroll);
router.post("/:id/pay", authorize(["Super Admin", "Admin", "Accountant"]), markPayrollAsPaid);

export default router;

