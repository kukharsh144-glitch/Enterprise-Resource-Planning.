import { Router } from "express";
import * as leaveController from "../controllers/leave.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

/**
 * Leave Management Routes
 *
 * All routes require JWT authentication via verifyJWT middleware
 * Role-based authorization enforced via authorize() + controller-level checks
 *
 * Base path: /api/leaves
 */

const router = Router();

// ===== MIDDLEWARE CHAIN =====
router.use(verifyJWT);

// ===== SELF-SERVICE ROUTES (All authenticated users) =====

/**
 * @route   GET /api/leaves/my
 * @desc    Get logged-in user's own leave history
 * @access  All authenticated users
 * @params  status (optional), page (default: 1), limit (default: 10)
 */
router.get("/my", leaveController.getMyLeaves);

// ===== READ / REPORTING ROUTES =====

/**
 * @route   GET /api/leaves
 * @desc    Get all leave records with filtering, sorting, and pagination
 * @access  Super Admin, Admin, Manager, HR, Accountant
 * @params  page, limit, sort, status, type, employee, startDate, endDate
 */
router.get("/", leaveController.getAllLeaves);

/**
 * @route   GET /api/leaves/stats/overview
 * @desc    Get leave statistics for HR dashboard
 * @access  Super Admin, Admin, HR
 */
router.get("/stats/overview", leaveController.getLeaveStatistics);

/**
 * @route   GET /api/leaves/:id
 * @desc    Get a single leave record by ID
 * @access  Super Admin, Admin, Manager, HR, Accountant, Employee (own leave)
 */
router.get("/:id", leaveController.getLeaveById);

// ===== APPLY / MUTATE ROUTES =====

/**
 * @route   POST /api/leaves
 * @desc    Apply for leave
 * @access  Super Admin, Admin, Manager, HR, Accountant, Employee
 * @body    {
 *   employee (required unless role is Employee): Employee ObjectId,
 *   type (required): Sick | Casual | Paid | Maternity,
 *   startDate (required),
 *   endDate (required),
 *   reason (optional)
 * }
 */
router.post(
  "/",
  authorize(["Super Admin", "Admin", "Manager", "HR", "Accountant", "Employee"]),
  leaveController.applyLeave
);

/**
 * @route   PUT /api/leaves/:id/approve
 * @desc    Approve a pending leave request
 * @access  Super Admin, Admin, Manager, HR
 */
router.put(
  "/:id/approve",
  authorize(["Super Admin", "Admin", "Manager", "HR"]),
  leaveController.approveLeave
);

/**
 * @route   PUT /api/leaves/:id/reject
 * @desc    Reject a pending leave request
 * @access  Super Admin, Admin, Manager, HR
 * @body    { reason (optional) }
 */
router.put(
  "/:id/reject",
  authorize(["Super Admin", "Admin", "Manager", "HR"]),
  leaveController.rejectLeave
);

/**
 * @route   PUT /api/leaves/:id/cancel
 * @desc    Cancel/withdraw a still-pending leave request
 * @access  Employee (own leave), Super Admin, Admin, Manager, HR (any)
 * @note    Only leaves with status "Applied" can be cancelled
 */
router.put("/:id/cancel", leaveController.cancelLeave);

/**
 * @route   DELETE /api/leaves/:id
 * @desc    Permanently delete a leave record
 * @access  Super Admin
 */
router.delete(
  "/:id",
  authorize(["Super Admin"]),
  leaveController.deleteLeave
);

export default router;