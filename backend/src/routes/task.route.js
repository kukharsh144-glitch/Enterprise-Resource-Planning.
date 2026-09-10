import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

/**
 * Task Management Routes
 *
 * All routes require JWT authentication via verifyJWT middleware.
 * Coarse role gating is done via authorize() where the rule is a pure
 * role list; anything that also depends on project ownership or task
 * assignment (Manager-owns-project, Employee-owns-task) is left to the
 * controller, same pattern used in employee/leave/department routes.
 *
 * Base path: /api/tasks
 */

const router = Router();

// ===== MIDDLEWARE CHAIN =====
router.use(verifyJWT);

// ===== SELF-SERVICE / READ ROUTES =====

/**
 * @route   GET /api/tasks/my
 * @desc    Get logged-in user's own assigned tasks
 * @access  All authenticated users
 * @params  status (optional), page (default: 1), limit (default: 10)
 */
router.get("/my", taskController.getMyTasks);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filtering, sorting, and pagination
 * @access  Super Admin, Admin, Manager, HR, Accountant
 * @params  page, limit, sort, project, assignedTo, status, priority,
 *          search, dueBefore, dueAfter
 */
router.get("/", taskController.getAllTasks);

/**
 * @route   GET /api/tasks/project/:projectId
 * @desc    Get all tasks belonging to a project
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
router.get("/project/:projectId", taskController.getTasksByProject);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 * @access  Super Admin, Admin, Manager, HR, Accountant, Employee (own task)
 */
router.get("/:id", taskController.getTaskById);

// ===== CREATE / MUTATE ROUTES =====

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Super Admin, Admin, Manager (Manager limited to own projects)
 * @body    {
 *   project (required): Project ObjectId,
 *   assignedTo (required): Employee ObjectId,
 *   title (required),
 *   description (optional),
 *   priority (optional, default: Medium),
 *   estimatedHours (optional, default: 1),
 *   startDate (optional),
 *   dueDate (optional),
 *   weight (optional, default: 1),
 *   dependencies (optional): Array of Task ObjectIds in the same project,
 *   tags (optional): Array of strings
 * }
 */
router.post(
  "/",
  authorize(["Super Admin", "Admin", "Manager"]),
  taskController.createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Super Admin, Admin, Manager (limited to own projects)
 * @body    Any updatable fields (protected fields automatically excluded)
 */
router.put(
  "/:id",
  authorize(["Super Admin", "Admin", "Manager"]),
  taskController.updateTask
);

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Change task status (Pending | In Progress | Completed | Blocked)
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 * @body    { status (required) }
 * @note    No route-level authorize() — ownership (assignee) is checked
 *          in the controller since it depends on the specific task.
 */
router.put("/:id/status", taskController.changeTaskStatus);

/**
 * @route   PUT /api/tasks/:id/progress
 * @desc    Update task progress percentage
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 * @body    { progressPercent (required, 0-100) }
 */
router.put("/:id/progress", taskController.updateTaskProgress);

/**
 * @route   PUT /api/tasks/:id/block
 * @desc    Mark a task as Blocked with a reason
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 * @body    { reason (required) }
 */
router.put("/:id/block", taskController.blockTask);

/**
 * @route   PUT /api/tasks/:id/unblock
 * @desc    Unblock a task (returns it to "In Progress")
 * @access  Super Admin, Admin, Manager, or the assigned Employee
 */
router.put("/:id/unblock", taskController.unblockTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Super Admin, Admin, Manager (limited to own projects)
 * @note    Blocked if other tasks list this task as a dependency
 */
router.delete(
  "/:id",
  authorize(["Super Admin", "Admin", "Manager"]),
  taskController.deleteTask
);

export default router;