import { Router } from "express";
import * as departmentController from "../controllers/department.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

/**
 * Department Management Routes
 *
 * All routes require JWT authentication via verifyJWT middleware
 * Role-based authorization enforced via authorize() + controller-level checks
 *
 * Base path: /api/departments
 */

const router = Router();

// ===== MIDDLEWARE CHAIN =====
router.use(verifyJWT);

// ===== READ ROUTES (All authenticated users) =====

/**
 * @route   GET /api/departments
 * @desc    Get all departments with search, pagination, and employee counts
 * @access  All authenticated users
 * @params  page (default: 1), limit (default: 10), sort (default: name), search
 */
router.get("/", departmentController.getAllDepartments);

/**
 * @route   GET /api/departments/stats/overview
 * @desc    Get department statistics overview
 * @access  Super Admin, Admin, HR
 */
router.get("/stats/overview", departmentController.getDepartmentStatistics);

/**
 * @route   GET /api/departments/:id
 * @desc    Get a single department by ID with employee count
 * @access  All authenticated users
 */
router.get("/:id", departmentController.getDepartmentById);

// ===== PROTECTED CRUD ROUTES (Admin+ or HR) =====

/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Super Admin, Admin, HR
 * @body    {
 *   name (required),
 *   code (required),
 *   description (optional),
 *   manager (optional): Employee ObjectId
 * }
 */
router.post(
  "/",
  authorize(["Super Admin", "Admin", "HR"]),
  departmentController.createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department information
 * @access  Super Admin, Admin, HR
 * @body    Any updatable fields (protected fields automatically excluded)
 */
router.put(
  "/:id",
  authorize(["Super Admin", "Admin", "HR"]),
  departmentController.updateDepartment
);

/**
 * @route   PUT /api/departments/:id/manager
 * @desc    Assign or clear a department's manager
 * @access  Super Admin, Admin, HR
 * @body    { manager: Employee ObjectId | null }
 * @note    The chosen employee must already belong to this department
 */
router.put(
  "/:id/manager",
  authorize(["Super Admin", "Admin", "HR"]),
  departmentController.assignDepartmentManager
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete a department
 * @access  Super Admin
 * @note    Cannot delete if the department has active (non-terminated) employees
 */
router.delete(
  "/:id",
  authorize(["Super Admin"]),
  departmentController.deleteDepartment
);

export default router;