import mongoose from "mongoose";
import Expense from "../models/Expense.model.js";
import Department from "../models/Department.model.js";
import Employee from "../models/Employee.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Helper: write an audit log entry without ever breaking the main flow.
 * NOTE: ActivityLog.action only has "record_expense" for expenses today —
 * there's no enum value for submitting, approving, rejecting, editing, or
 * deleting one, so those transitions are intentionally left unlogged below
 * rather than passed to logActivity, where an invalid value would just
 * fail schema validation silently. Extend the enum first (e.g.
 * "approve_expense" / "reject_expense") if those need auditing too.
 */
const logActivity = (req, action, entityId, details = {}) => {
  ActivityLog.logActivity({
    actor: req.user?._id,
    action,
    entityType: "Expense",
    entityId,
    details,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });
};

/**
 * @desc    Record a new expense
 * @route   POST /api/v1/expenses
 * @access  Super Admin, Admin, Accountant
 */
export const createExpense = asyncHandler(async (req, res) => {
  const { category, amount, description, department, spentBy, expenseDate, status } =
    req.body;

  if (!category || amount === undefined || !description || !department) {
    throw new apiError(
      400,
      "Category, amount, description, and department are all required"
    );
  }

  if (amount < 0) {
    throw new apiError(400, "Amount cannot be negative");
  }

  if (!mongoose.Types.ObjectId.isValid(department)) {
    throw new apiError(400, "Invalid department id");
  }

  const departmentDoc = await Department.findById(department);
  if (!departmentDoc) {
    throw new apiError(404, "Department not found");
  }

  if (spentBy) {
    if (!mongoose.Types.ObjectId.isValid(spentBy)) {
      throw new apiError(400, "Invalid employee id for spentBy");
    }
    const employeeDoc = await Employee.findById(spentBy);
    if (!employeeDoc) {
      throw new apiError(404, "Employee not found for spentBy");
    }
  }

  // Only allow starting in Draft or Submitted — approval/rejection happen
  // via their own dedicated endpoints, not at creation time.
  const initialStatus = ["Draft", "Submitted"].includes(status) ? status : "Submitted";

  const expense = await Expense.create({
    category,
    amount,
    description,
    department,
    spentBy: spentBy || null,
    expenseDate: expenseDate || Date.now(),
    status: initialStatus,
  });

  logActivity(req, "record_expense", expense._id, {
    category,
    amount,
    department,
    status: initialStatus,
  });

  logger.info("Expense recorded", {
    expenseId: expense._id,
    actor: req.user?._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, expense, "Expense recorded successfully"));
});

/**
 * @desc    Get all expenses (filters + pagination)
 * @route   GET /api/v1/expenses
 * @access  Super Admin, Admin, Accountant
 */
export const getAllExpenses = asyncHandler(async (req, res) => {
  const {
    status,
    department,
    spentBy,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = new RegExp(category.trim(), "i");

  if (department) {
    if (!mongoose.Types.ObjectId.isValid(department)) {
      throw new apiError(400, "Invalid department id");
    }
    query.department = department;
  }

  if (spentBy) {
    if (!mongoose.Types.ObjectId.isValid(spentBy)) {
      throw new apiError(400, "Invalid employee id");
    }
    query.spentBy = spentBy;
  }

  if (startDate || endDate) {
    query.expenseDate = {};
    if (startDate) query.expenseDate.$gte = new Date(startDate);
    if (endDate) query.expenseDate.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate("department", "name code")
      .populate({
        path: "spentBy",
        select: "designation user",
        populate: { path: "user", select: "username email" },
      })
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Expense.countDocuments(query),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        expenses,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Expenses fetched successfully"
    )
  );
});

/**
 * @desc    Get a single expense by id
 * @route   GET /api/v1/expenses/:id
 * @access  Super Admin, Admin, Accountant
 */
export const getExpenseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid expense id");
  }

  const expense = await Expense.findById(id)
    .populate("department", "name code")
    .populate({
      path: "spentBy",
      select: "designation user",
      populate: { path: "user", select: "username email" },
    });

  if (!expense) {
    throw new apiError(404, "Expense not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, expense, "Expense fetched successfully"));
});

/**
 * @desc    Get all expenses for a given department
 * @route   GET /api/v1/expenses/department/:departmentId
 * @access  Super Admin, Admin, Accountant
 */
export const getExpensesByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new apiError(400, "Invalid department id");
  }

  const expenses = await Expense.find({ department: departmentId })
    .populate({
      path: "spentBy",
      select: "designation user",
      populate: { path: "user", select: "username email" },
    })
    .sort({ expenseDate: -1 });

  return res
    .status(200)
    .json(new apiResponse(200, expenses, "Department expenses fetched successfully"));
});

/**
 * @desc    Get all expenses submitted by a given employee
 * @route   GET /api/v1/expenses/employee/:employeeId
 * @access  Super Admin, Admin, Accountant
 */
export const getExpensesByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new apiError(400, "Invalid employee id");
  }

  const expenses = await Expense.find({ spentBy: employeeId })
    .populate("department", "name code")
    .sort({ expenseDate: -1 });

  return res
    .status(200)
    .json(new apiResponse(200, expenses, "Employee expenses fetched successfully"));
});

/**
 * @desc    Update an expense's details (only while Draft or Submitted)
 * @route   PATCH /api/v1/expenses/:id
 * @access  Super Admin, Admin, Accountant
 */
export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, amount, description, department, expenseDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid expense id");
  }

  const expense = await Expense.findById(id);
  if (!expense) {
    throw new apiError(404, "Expense not found");
  }

  if (!["Draft", "Submitted"].includes(expense.status)) {
    throw new apiError(
      400,
      `Cannot modify an expense with status "${expense.status}"`
    );
  }

  if (department !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(department)) {
      throw new apiError(400, "Invalid department id");
    }
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      throw new apiError(404, "Department not found");
    }
    expense.department = department;
  }

  if (category !== undefined) expense.category = category;
  if (amount !== undefined) {
    if (amount < 0) {
      throw new apiError(400, "Amount cannot be negative");
    }
    expense.amount = amount;
  }
  if (description !== undefined) expense.description = description;
  if (expenseDate !== undefined) expense.expenseDate = expenseDate;

  await expense.save();

  return res
    .status(200)
    .json(new apiResponse(200, expense, "Expense updated successfully"));
});

/**
 * @desc    Submit a draft expense for approval
 * @route   PATCH /api/v1/expenses/:id/submit
 * @access  Super Admin, Admin, Accountant
 */
export const submitExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid expense id");
  }

  const expense = await Expense.findById(id);
  if (!expense) {
    throw new apiError(404, "Expense not found");
  }

  if (expense.status !== "Draft") {
    throw new apiError(
      400,
      `Only draft expenses can be submitted. Current status: "${expense.status}"`
    );
  }

  expense.status = "Submitted";
  await expense.save();

  return res
    .status(200)
    .json(new apiResponse(200, expense, "Expense submitted successfully"));
});

/**
 * @desc    Approve a submitted expense
 * @route   PATCH /api/v1/expenses/:id/approve
 * @access  Super Admin, Admin, Accountant
 */
export const approveExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid expense id");
  }

  const expense = await Expense.findById(id);
  if (!expense) {
    throw new apiError(404, "Expense not found");
  }

  if (expense.status !== "Submitted") {
    throw new apiError(
      400,
      `Only submitted expenses can be approved. Current status: "${expense.status}"`
    );
  }

  expense.status = "Approved";
  await expense.save();

  // Not written to ActivityLog: no "approve_expense" action exists in the
  // schema's enum yet. Add one there first if this needs auditing.

  return res
    .status(200)
    .json(new apiResponse(200, expense, "Expense approved successfully"));
});

/**
 * @desc    Reject a submitted expense
 * @route   PATCH /api/v1/expenses/:id/reject
 * @access  Super Admin, Admin, Accountant
 */
export const rejectExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid expense id");
  }

  const expense = await Expense.findById(id);
  if (!expense) {
    throw new apiError(404, "Expense not found");
  }

  if (expense.status !== "Submitted") {
    throw new apiError(
      400,
      `Only submitted expenses can be rejected. Current status: "${expense.status}"`
    );
  }

  expense.status = "Rejected";
  await expense.save();

  // Not written to ActivityLog: no "reject_expense" action exists in the
  // schema's enum yet. Add one there first if this needs auditing.
  logger.info("Expense rejected", {
    expenseId: expense._id,
    reason: reason || "Not specified",
    actor: req.user?._id,
  });

  return res
    .status(200)
    .json(new apiResponse(200, expense, "Expense rejected successfully"));
});

/**
 * @desc    Permanently delete an expense (only while still Draft)
 * @route   DELETE /api/v1/expenses/:id
 * @access  Super Admin
 */
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid expense id");
  }

  const expense = await Expense.findById(id);
  if (!expense) {
    throw new apiError(404, "Expense not found");
  }

  if (expense.status !== "Draft") {
    throw new apiError(
      400,
      `Only draft expenses can be deleted. Current status: "${expense.status}"`
    );
  }

  await Expense.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Expense deleted successfully"));
});