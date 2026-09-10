import { Router } from "express";
import { verifyJWT, checkPermission } from "../middlewares/auth.middleware.js";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByDepartment,
  getExpensesByEmployee,
  updateExpense,
  submitExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";

const router = Router();

// All expense routes require authentication
router.use(verifyJWT);

// GET /api/v1/expenses/department/:departmentId — before "/:id"
router
  .route("/department/:departmentId")
  .get(checkPermission("accounting", "read"), getExpensesByDepartment);

// GET /api/v1/expenses/employee/:employeeId — before "/:id"
router
  .route("/employee/:employeeId")
  .get(checkPermission("accounting", "read"), getExpensesByEmployee);

// POST /api/v1/expenses  |  GET /api/v1/expenses
router
  .route("/")
  .post(checkPermission("accounting", "create"), createExpense)
  .get(checkPermission("accounting", "read"), getAllExpenses);

// PATCH /api/v1/expenses/:id/submit
router.route("/:id/submit").patch(checkPermission("accounting", "update"), submitExpense);

// PATCH /api/v1/expenses/:id/approve
router
  .route("/:id/approve")
  .patch(checkPermission("accounting", "update"), approveExpense);

// PATCH /api/v1/expenses/:id/reject
router
  .route("/:id/reject")
  .patch(checkPermission("accounting", "update"), rejectExpense);

// GET /api/v1/expenses/:id | PATCH /api/v1/expenses/:id | DELETE /api/v1/expenses/:id
router
  .route("/:id")
  .get(checkPermission("accounting", "read"), getExpenseById)
  .patch(checkPermission("accounting", "update"), updateExpense)
  .delete(checkPermission("accounting", "delete"), deleteExpense);

export default router;