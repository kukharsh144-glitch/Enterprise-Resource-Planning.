import { Router } from "express";
import * as employeeController from "../controllers/employee.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

/**
 * Employee Management Routes
 * 
 * All routes require JWT authentication via verifyJWT middleware
 * Role-based authorization enforced in controller methods
 * 
 * Base path: /api/employees
 */

const router = Router();

// ===== MIDDLEWARE CHAIN =====
// Apply JWT verification to all routes
router.use(verifyJWT);

// ===== PROFILE ROUTES (All authenticated users) =====

/**
 * @route   GET /api/employees/profile/me
 * @desc    Get logged-in employee's own profile with workload and assets
 * @access  All authenticated users
 * @returns Enriched employee profile with tenure, workload, leaves, assets
 */
router.get("/profile/me", employeeController.getMyProfile);

/**
 * @route   PUT /api/employees/profile/me
 * @desc    Update logged-in employee's own profile (limited fields)
 * @access  All authenticated users
 * @body    {skills: [Array of skill strings]}
 * @returns Updated employee profile
 */
router.put("/profile/me", employeeController.updateMyProfile);

// ===== PUBLIC ROUTES (All authenticated users with role checks in controller) =====

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filtering, sorting, and pagination
 * @access  Super Admin, Admin, HR, Manager, Accountant, Employee (limited)
 * @params  page (default: 1), limit (default: 10, max: 100)
 * @params  sort (default: -createdAt), status, department, designation, search
 * @returns Paginated list of employees
 */
router.get("/", employeeController.getAllEmployees);

/**
 * @route   GET /api/employees/stats/overview
 * @desc    Get employee statistics for HR dashboard
 * @access  Super Admin, Admin, HR
 * @returns Total count, breakdown by status/department, new hits/terminations
 */
router.get("/stats/overview", employeeController.getEmployeeStatistics);

/**
 * @route   GET /api/employees/stats/activities
 * @desc    Get recent system activity logs
 * @access  All authenticated users
 */
router.get("/stats/activities", employeeController.getRecentActivities);

/**
 * @route   GET /api/employees/export/csv
 * @desc    Export employees to CSV file
 * @access  Super Admin, Admin, HR
 * @params  status (optional), department (optional)
 * @returns CSV file download
 */
router.get("/export/csv", employeeController.exportEmployeesToCSV);

/**
 * @route   GET /api/employees/department/:departmentId
 * @desc    Get all employees in a specific department
 * @access  Super Admin, Admin, HR, Manager
 * @params  page (optional), limit (optional), status (optional)
 * @returns Paginated list of department employees
 */
router.get(
  "/department/:departmentId",
  employeeController.getEmployeesByDepartment
);

/**
 * @route   GET /api/employees/:id
 * @desc    Get single employee by ID with comprehensive details
 * @access  Super Admin, Admin, HR, Manager, Employee (own profile)
 * @returns Employee profile with tenure, workload, leaves, assets
 */
router.get("/:id", employeeController.getEmployeeById);

/**
 * @route   GET /api/employees/:id/workload
 * @desc    Get employee's current workload and project allocation
 * @access  Super Admin, Admin, HR, Manager
 * @returns Workload details including allocation %, available capacity, projects
 */
router.get("/:id/workload", employeeController.getEmployeeWorkload);

// ===== PROTECTED CRUD ROUTES (Admin+ or HR) =====

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Super Admin, Admin, HR
 */
router.post(
  "/",
  authorize(["Super Admin", "Admin", "HR"]),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  employeeController.createEmployee
);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee information
 * @access  Super Admin, Admin, HR, Manager (limited)
 */
router.put(
  "/:id",
  authorize(["Super Admin", "Admin", "HR", "Manager"]),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  employeeController.updateEmployee
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee (soft delete - marks as Terminated)
 * @access  Super Admin, Admin
 * @note    Cannot delete if employee has active projects or pending leaves
 */
router.delete(
  "/:id",
  authorize(["Super Admin", "Admin"]),
  employeeController.deleteEmployee
);

/**
 * @route   PUT /api/employees/:id/status
 * @desc    Change employee status
 * @access  Super Admin, Admin, HR
 * @body    {
 *   status (required): Active | On Leave | Terminated
 * }
 */
router.put(
  "/:id/status",
  authorize(["Super Admin", "Admin", "HR"]),
  employeeController.updateEmployeeStatus
);

// ===== SKILL MANAGEMENT ROUTES =====

/**
 * @route   POST /api/employees/:id/skills
 * @desc    Add a skill to employee
 * @access  Super Admin, Admin, HR, Employee (own profile)
 * @body    {
 *   skill (required): Skill name to add
 * }
 * @note    Maximum 50 skills per employee, duplicates not allowed
 */
router.post(
  "/:id/skills",
  authorize(["Super Admin", "Admin", "HR", "Employee"]),
  employeeController.addSkill
);

/**
 * @route   DELETE /api/employees/:id/skills/:skill
 * @desc    Remove a skill from employee
 * @access  Super Admin, Admin, HR, Employee (own profile)
 * @params  skill: Skill name to remove (URL encoded)
 */
router.delete(
  "/:id/skills/:skill",
  authorize(["Super Admin", "Admin", "HR", "Employee"]),
  employeeController.removeSkill
);

export default router;