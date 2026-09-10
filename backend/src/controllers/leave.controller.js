import mongoose from "mongoose";
import Leave from "../models/Leave.model.js";
import Employee from "../models/Employee.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * Leave Controller
 * Manages leave applications, approvals, and reporting
 *
 * Role-based Access (mirrors checkPermission "leaves" module in
 * authorization.middleware.js):
 * - Super Admin, Admin, Manager, HR, Accountant, Employee: Apply for leave
 * - Super Admin, Admin, Manager, HR: Approve / Reject leave
 * - Super Admin, Admin, Manager, HR, Accountant: Read (list/report)
 * - Super Admin: Hard delete a leave record
 * - Employee: Read/cancel own leave only
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Check if user has permission for leave operations
 */
const checkLeavePermission = (userRole, operation) => {
  const permissions = {
    create: ["Super Admin", "Admin", "Manager", "HR", "Accountant", "Employee"],
    approve: ["Super Admin", "Admin", "Manager", "HR"],
    read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
    delete: ["Super Admin"],
  };

  return permissions[operation]?.includes(userRole) || false;
};

/**
 * Build filter query for listing leaves based on query params
 */
const buildLeaveFilterQuery = (filters = {}) => {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.employee) query.employee = filters.employee;

  if (filters.startDate || filters.endDate) {
    query.startDate = {};
    if (filters.startDate) query.startDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.startDate.$lte = new Date(filters.endDate);
  }

  return query;
};

/**
 * Check whether an employee already has an overlapping leave request
 * (status Applied or Approved) for the given date range.
 */
const hasOverlappingLeave = async (employeeId, startDate, endDate, excludeLeaveId = null) => {
  const query = {
    employee: employeeId,
    status: { $in: ["Applied", "Approved"] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }

  const overlap = await Leave.findOne(query);
  return !!overlap;
};

/**
 * Resolve the Employee document for the currently authenticated user
 */
const getOwnEmployeeRecord = async (userId) => {
  return await Employee.findOne({ user: userId });
};

// ===== PUBLIC CONTROLLER METHODS =====

/**
 * @desc    Apply for leave
 * @route   POST /api/leaves
 * @access  Super Admin, Admin, Manager, HR, Accountant, Employee
 */
export const applyLeave = asyncHandler(async (req, res) => {
  if (!checkLeavePermission(req.user.role, "create")) {
    throw new apiError(403, "Not authorized to apply for leave");
  }

  const { type, startDate, endDate, reason } = req.body;
  let { employee } = req.body;

  if (!type || !startDate || !endDate) {
    throw new apiError(400, "type, startDate, and endDate are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new apiError(400, "Invalid startDate or endDate");
  }

  if (end < start) {
    throw new apiError(400, "End date must be on or after start date");
  }

  try {
    // Employees can only apply for their own leave — ignore any spoofed
    // employee id in the body and resolve it from the authenticated user.
    if (req.user.role === "Employee") {
      const ownEmployee = await getOwnEmployeeRecord(req.user.id);
      if (!ownEmployee) {
        throw new apiError(404, "Employee profile not found for this user");
      }
      employee = ownEmployee._id;
    } else {
      if (!employee) {
        throw new apiError(400, "employee is required");
      }
      if (!employee.match(/^[0-9a-fA-F]{24}$/)) {
        throw new apiError(400, "Invalid employee ID format");
      }
      const employeeExists = await Employee.findById(employee);
      if (!employeeExists) {
        throw new apiError(404, "Employee not found");
      }
    }

    // Prevent overlapping leave requests
    const overlapping = await hasOverlappingLeave(employee, start, end);
    if (overlapping) {
      throw new apiError(
        400,
        "Employee already has a pending or approved leave overlapping these dates"
      );
    }

    const newLeave = await Leave.create({
      employee,
      type,
      startDate: start,
      endDate: end,
      reason: reason?.trim(),
      status: "Applied",
    });

    await newLeave.populate({
      path: "employee",
      select: "designation department",
      populate: { path: "user", select: "fullname email" },
    });

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "apply_leave",
      entityType: "Leave",
      entityId: newLeave._id,
      details: { leaveType: type, startDate: start, endDate: end },
    });

    res.status(201).json(
      new apiResponse(201, "Leave applied successfully", newLeave)
    );

    logger.info(`User ${req.user.id} applied for leave: ${newLeave._id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error applying for leave:", error);
    throw new apiError(500, "Error applying for leave");
  }
});

/**
 * @desc    Get all leaves with filtering, pagination, and sorting
 * @route   GET /api/leaves
 * @access  Super Admin, Admin, Manager, HR, Accountant
 */
export const getAllLeaves = asyncHandler(async (req, res) => {
  if (!checkLeavePermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view leave records");
  }

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status,
    type,
    employee,
    startDate,
    endDate,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Managers can eventually be scoped to their own department/team here
  if (req.user.role === "Manager") {
    // Add department/team scoping logic once manager-department mapping exists
  }

  const filterQuery = buildLeaveFilterQuery({ status, type, employee, startDate, endDate });

  try {
    const [leaves, totalCount] = await Promise.all([
      Leave.find(filterQuery)
        .populate({
          path: "employee",
          select: "designation department",
          populate: { path: "user", select: "fullname email" },
        })
        .populate("approvedBy", "username email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Leave.countDocuments(filterQuery),
    ]);

    res.status(200).json(
      new apiResponse(200, "Leaves retrieved successfully", {
        leaves,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
          limit: limitNum,
        },
      })
    );

    logger.info(`${req.user.role} fetched leaves - page: ${pageNum}, limit: ${limitNum}`);
  } catch (error) {
    logger.error("Error fetching leaves:", error);
    throw new apiError(500, "Error fetching leaves");
  }
});

/**
 * @desc    Get logged-in user's own leave history
 * @route   GET /api/leaves/my
 * @access  All authenticated users
 */
export const getMyLeaves = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  try {
    const ownEmployee = await getOwnEmployeeRecord(req.user.id);
    if (!ownEmployee) {
      throw new apiError(404, "Employee profile not found for this user");
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filterQuery = { employee: ownEmployee._id };
    if (status) filterQuery.status = status;

    const [leaves, totalCount] = await Promise.all([
      Leave.find(filterQuery)
        .populate("approvedBy", "username email")
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Leave.countDocuments(filterQuery),
    ]);

    res.status(200).json(
      new apiResponse(200, "My leaves retrieved successfully", {
        leaves,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
        },
      })
    );

    logger.info(`Employee ${req.user.id} fetched their leave history`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching own leaves:", error);
    throw new apiError(500, "Error fetching your leaves");
  }
});

/**
 * @desc    Get single leave by ID
 * @route   GET /api/leaves/:id
 * @access  Super Admin, Admin, Manager, HR, Accountant, Employee (own leave)
 */
export const getLeaveById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid leave ID format");
  }

  try {
    const leave = await Leave.findById(id).populate({
      path: "employee",
      select: "designation department user",
      populate: { path: "user", select: "fullname email" },
    }).populate("approvedBy", "username email");

    if (!leave) {
      throw new apiError(404, "Leave record not found");
    }

    const isOwner = leave.employee?.user?._id?.toString() === req.user.id;

    if (!checkLeavePermission(req.user.role, "read") && !isOwner) {
      throw new apiError(403, "Not authorized to view this leave record");
    }

    res.status(200).json(
      new apiResponse(200, "Leave retrieved successfully", leave)
    );

    logger.info(`User ${req.user.id} viewed leave ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching leave:", error);
    throw new apiError(500, "Error fetching leave");
  }
});

/**
 * @desc    Approve a leave request
 * @route   PUT /api/leaves/:id/approve
 * @access  Super Admin, Admin, Manager, HR
 */
export const approveLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid leave ID format");
  }

  if (!checkLeavePermission(req.user.role, "approve")) {
    throw new apiError(403, "Not authorized to approve leave requests");
  }

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      throw new apiError(404, "Leave record not found");
    }

    if (leave.status !== "Applied") {
      throw new apiError(400, `Cannot approve a leave that is already ${leave.status}`);
    }

    leave.status = "Approved";
    leave.approvedBy = req.user.id;
    await leave.save();

    await leave.populate([
      { path: "employee", select: "designation department" },
      { path: "approvedBy", select: "username email" },
    ]);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "approve_leave",
      entityType: "Leave",
      entityId: leave._id,
    });

    res.status(200).json(
      new apiResponse(200, "Leave approved successfully", leave)
    );

    logger.info(`User ${req.user.id} approved leave ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error approving leave:", error);
    throw new apiError(500, "Error approving leave");
  }
});

/**
 * @desc    Reject a leave request
 * @route   PUT /api/leaves/:id/reject
 * @access  Super Admin, Admin, Manager, HR
 */
export const rejectLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid leave ID format");
  }

  if (!checkLeavePermission(req.user.role, "approve")) {
    throw new apiError(403, "Not authorized to reject leave requests");
  }

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      throw new apiError(404, "Leave record not found");
    }

    if (leave.status !== "Applied") {
      throw new apiError(400, `Cannot reject a leave that is already ${leave.status}`);
    }

    leave.status = "Rejected";
    leave.approvedBy = req.user.id;
    await leave.save();

    await leave.populate([
      { path: "employee", select: "designation department" },
      { path: "approvedBy", select: "username email" },
    ]);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "reject_leave",
      entityType: "Leave",
      entityId: leave._id,
      details: reason ? { reason } : undefined,
    });

    res.status(200).json(
      new apiResponse(200, "Leave rejected successfully", leave)
    );

    logger.info(`User ${req.user.id} rejected leave ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error rejecting leave:", error);
    throw new apiError(500, "Error rejecting leave");
  }
});

/**
 * @desc    Cancel/withdraw a leave request that is still pending
 * @route   PUT /api/leaves/:id/cancel
 * @access  Super Admin, Admin, Manager, HR (any), Employee (own only)
 * @note    The Leave model has no "Cancelled" status, so a still-pending
 *          ("Applied") request is removed outright. Once a leave has been
 *          Approved or Rejected it can no longer be cancelled through this
 *          endpoint. Consider adding a "Cancelled" enum value to the model
 *          if you'd rather keep a soft record instead of deleting it.
 */
export const cancelLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid leave ID format");
  }

  try {
    const leave = await Leave.findById(id).populate({
      path: "employee",
      select: "user",
    });

    if (!leave) {
      throw new apiError(404, "Leave record not found");
    }

    const isOwner = leave.employee?.user?.toString() === req.user.id;
    const canManageAny = checkLeavePermission(req.user.role, "approve");

    if (!isOwner && !canManageAny) {
      throw new apiError(403, "Not authorized to cancel this leave request");
    }

    if (leave.status !== "Applied") {
      throw new apiError(
        400,
        `Cannot cancel a leave that is already ${leave.status}`
      );
    }

    await Leave.findByIdAndDelete(id);

    await ActivityLog.logActivity({
      actor: req.user.id,
      action: "cancel_leave",
      entityType: "Leave",
      entityId: id,
    });

    res.status(200).json(
      new apiResponse(200, "Leave request cancelled successfully", { id })
    );

    logger.info(`User ${req.user.id} cancelled leave ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error cancelling leave:", error);
    throw new apiError(500, "Error cancelling leave");
  }
});

/**
 * @desc    Permanently delete a leave record
 * @route   DELETE /api/leaves/:id
 * @access  Super Admin
 */
export const deleteLeave = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid leave ID format");
  }

  if (!checkLeavePermission(req.user.role, "delete")) {
    throw new apiError(403, "Not authorized to delete leave records");
  }

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      throw new apiError(404, "Leave record not found");
    }

    await Leave.findByIdAndDelete(id);

    res.status(200).json(
      new apiResponse(200, "Leave record deleted successfully", { id })
    );

    logger.info(`User ${req.user.id} deleted leave record ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error deleting leave:", error);
    throw new apiError(500, "Error deleting leave");
  }
});

/**
 * @desc    Get leave statistics for HR dashboard
 * @route   GET /api/leaves/stats/overview
 * @access  Super Admin, Admin, HR
 */
export const getLeaveStatistics = asyncHandler(async (req, res) => {
  if (!["Super Admin", "Admin", "HR"].includes(req.user.role)) {
    throw new apiError(403, "Not authorized to view leave statistics");
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeaves,
      leavesByStatus,
      leavesByType,
      appliedThisMonth,
      pendingApprovalCount,
      upcomingApprovedCount,
      pendingApprovalList,
    ] = await Promise.all([
      Leave.countDocuments(),

      Leave.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      Leave.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),

      Leave.countDocuments({ createdAt: { $gte: monthStart, $lte: now } }),

      Leave.countDocuments({ status: "Applied" }),

      Leave.countDocuments({ status: "Approved", startDate: { $gte: now } }),

      Leave.find({ status: "Applied" })
        .populate({
          path: "employee",
          populate: { path: "user", select: "fullname avatar" }
        })
        .sort("-createdAt")
        .limit(5)
        .lean(),
    ]);

    res.status(200).json(
      new apiResponse(200, {
        total: totalLeaves,
        byStatus: leavesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: leavesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        thisMonth: {
          applied: appliedThisMonth,
        },
        pendingApproval: pendingApprovalCount,
        upcomingApproved: upcomingApprovedCount,
        pendingList: pendingApprovalList,
      }, "Leave statistics retrieved successfully")
    );

    logger.info(`User ${req.user.id} viewed leave statistics`);
  } catch (error) {
    logger.error("Error fetching leave statistics:", error);
    throw new apiError(500, "Error fetching leave statistics");
  }
});

export default {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  cancelLeave,
  deleteLeave,
  getLeaveStatistics,
};