import Department from "../models/Department.model.js";
import Employee from "../models/Employee.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * Department Controller
 * Manages department CRUD and manager assignment
 *
 * Role-based Access:
 * - Super Admin, Admin, HR: Full CRUD + manager assignment
 * - All authenticated roles: Read (departments are basic reference data
 *   used across the app — e.g. employee forms, filters, dropdowns)
 * - Super Admin: Delete
 *
 * NOTE: authorization.middleware.js's checkPermission() does not define a
 * "departments" module (only users, employees, leaves, payroll, projects,
 * inventory, sales, accounting, crm, reports exist there). This controller
 * defines its own local permission table, the same way employee.controller.js
 * and leave.controller.js do, instead of relying on that helper.
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Check if user has permission for department operations
 */
const checkDepartmentPermission = (userRole, operation) => {
  const permissions = {
    create: ["Super Admin", "Admin", "HR"],
    read: ["Super Admin", "Admin", "Manager", "HR", "Accountant", "Employee"],
    update: ["Super Admin", "Admin", "HR"],
    delete: ["Super Admin"],
    manageManager: ["Super Admin", "Admin", "HR"],
  };

  return permissions[operation]?.includes(userRole) || false;
};

/**
 * Build filter query for listing departments
 */
const buildDepartmentFilterQuery = (filters = {}) => {
  const query = {};

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { code: { $regex: filters.search, $options: "i" } },
    ];
  }

  return query;
};

/**
 * Get count of active (non-terminated) employees in a department
 */
const getDepartmentEmployeeCount = async (departmentId) => {
  try {
    return await Employee.countDocuments({
      department: departmentId,
      status: { $ne: "Terminated" },
    });
  } catch (error) {
    logger.error("Error counting department employees:", error);
    return 0;
  }
};

// ===== PUBLIC CONTROLLER METHODS =====

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Super Admin, Admin, HR
 */
export const createDepartment = asyncHandler(async (req, res) => {
  if (!checkDepartmentPermission(req.user.role, "create")) {
    throw new apiError(403, "Not authorized to create departments");
  }

  const { name, code, description, manager } = req.body;

  if (!name || !code) {
    throw new apiError(400, "Missing required fields: name, code");
  }

  try {
    const existingDept = await Department.findOne({
      $or: [
        { name: new RegExp(`^${name.trim()}$`, "i") },
        { code: code.trim().toUpperCase() },
      ],
    });

    if (existingDept) {
      throw new apiError(400, "A department with this name or code already exists");
    }

    let managerId = null;
    if (manager) {
      if (!manager.match(/^[0-9a-fA-F]{24}$/)) {
        throw new apiError(400, "Invalid manager employee ID format");
      }
      const managerEmployee = await Employee.findById(manager);
      if (!managerEmployee) {
        throw new apiError(404, "Manager employee not found");
      }
      managerId = manager;
    }

    const newDepartment = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || "",
      manager: managerId,
    });

    await newDepartment.populate({
      path: "manager",
      select: "designation user",
      populate: { path: "user", select: "fullname email" },
    });

    res.status(201).json(
      new apiResponse(201, "Department created successfully", newDepartment)
    );

    logger.info(`User ${req.user.id} created department: ${newDepartment._id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    if (error.code === 11000) {
      throw new apiError(400, "A department with this name or code already exists");
    }
    logger.error("Error creating department:", error);
    throw new apiError(500, "Error creating department");
  }
});

/**
 * @desc    Get all departments with search, pagination, and employee counts
 * @route   GET /api/departments
 * @access  All authenticated users
 */
export const getAllDepartments = asyncHandler(async (req, res) => {
  if (!checkDepartmentPermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view departments");
  }

  const { page = 1, limit = 10, sort = "name", search } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filterQuery = buildDepartmentFilterQuery({ search });

  try {
    const [departments, totalCount] = await Promise.all([
      Department.find(filterQuery)
        .populate({
          path: "manager",
          select: "designation user",
          populate: { path: "user", select: "fullname email" },
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Department.countDocuments(filterQuery),
    ]);

    // Attach live employee counts
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => ({
        ...dept,
        employeeCount: await getDepartmentEmployeeCount(dept._id),
      }))
    );

    res.status(200).json(
      new apiResponse(200, "Departments retrieved successfully", {
        departments: departmentsWithCounts,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
          limit: limitNum,
        },
      })
    );

    logger.info(`${req.user.role} fetched departments - page: ${pageNum}, limit: ${limitNum}`);
  } catch (error) {
    logger.error("Error fetching departments:", error);
    throw new apiError(500, "Error fetching departments");
  }
});

/**
 * @desc    Get a single department by ID with employee count
 * @route   GET /api/departments/:id
 * @access  All authenticated users
 */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid department ID format");
  }

  if (!checkDepartmentPermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view this department");
  }

  try {
    const department = await Department.findById(id).populate({
      path: "manager",
      select: "designation user",
      populate: { path: "user", select: "fullname email" },
    });

    if (!department) {
      throw new apiError(404, "Department not found");
    }

    const employeeCount = await getDepartmentEmployeeCount(id);

    res.status(200).json(
      new apiResponse(200, "Department retrieved successfully", {
        ...department.toObject(),
        employeeCount,
      })
    );

    logger.info(`User ${req.user.id} viewed department ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching department:", error);
    throw new apiError(500, "Error fetching department");
  }
});

/**
 * @desc    Update department information
 * @route   PUT /api/departments/:id
 * @access  Super Admin, Admin, HR
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid department ID format");
  }

  if (!checkDepartmentPermission(req.user.role, "update")) {
    throw new apiError(403, "Not authorized to update departments");
  }

  const updateData = req.body;
  const protectedFields = ["_id", "createdAt"];
  protectedFields.forEach((field) => delete updateData[field]);

  try {
    const department = await Department.findById(id);
    if (!department) {
      throw new apiError(404, "Department not found");
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
      const nameClash = await Department.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${updateData.name}$`, "i"),
      });
      if (nameClash) {
        throw new apiError(400, "Another department already uses this name");
      }
    }

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
      const codeClash = await Department.findOne({
        _id: { $ne: id },
        code: updateData.code,
      });
      if (codeClash) {
        throw new apiError(400, "Another department already uses this code");
      }
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description?.trim() || "";
    }

    if (updateData.manager) {
      if (!updateData.manager.match(/^[0-9a-fA-F]{24}$/)) {
        throw new apiError(400, "Invalid manager employee ID format");
      }
      const managerEmployee = await Employee.findById(updateData.manager);
      if (!managerEmployee) {
        throw new apiError(404, "Manager employee not found");
      }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "manager",
      select: "designation user",
      populate: { path: "user", select: "fullname email" },
    });

    res.status(200).json(
      new apiResponse(200, "Department updated successfully", updatedDepartment)
    );

    logger.info(`User ${req.user.id} updated department: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    if (error.code === 11000) {
      throw new apiError(400, "A department with this name or code already exists");
    }
    logger.error("Error updating department:", error);
    throw new apiError(500, "Error updating department");
  }
});

/**
 * @desc    Assign or clear a department's manager
 * @route   PUT /api/departments/:id/manager
 * @access  Super Admin, Admin, HR
 * @body    { manager: Employee ObjectId | null }
 */
export const assignDepartmentManager = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { manager } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid department ID format");
  }

  if (!checkDepartmentPermission(req.user.role, "manageManager")) {
    throw new apiError(403, "Not authorized to assign a department manager");
  }

  try {
    const department = await Department.findById(id);
    if (!department) {
      throw new apiError(404, "Department not found");
    }

    if (manager === null) {
      department.manager = null;
      await department.save();
    } else {
      if (!manager?.match(/^[0-9a-fA-F]{24}$/)) {
        throw new apiError(400, "Invalid manager employee ID format");
      }

      const managerEmployee = await Employee.findById(manager);
      if (!managerEmployee) {
        throw new apiError(404, "Manager employee not found");
      }

      if (managerEmployee.department.toString() !== id) {
        throw new apiError(
          400,
          "The selected employee does not belong to this department"
        );
      }

      department.manager = manager;
      await department.save();
    }

    await department.populate({
      path: "manager",
      select: "designation user",
      populate: { path: "user", select: "fullname email" },
    });

    res.status(200).json(
      new apiResponse(200, "Department manager updated successfully", department)
    );

    logger.info(`User ${req.user.id} updated manager for department ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error assigning department manager:", error);
    throw new apiError(500, "Error assigning department manager");
  }
});

/**
 * @desc    Delete a department
 * @route   DELETE /api/departments/:id
 * @access  Super Admin
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid department ID format");
  }

  if (!checkDepartmentPermission(req.user.role, "delete")) {
    throw new apiError(403, "Not authorized to delete departments");
  }

  try {
    const department = await Department.findById(id);
    if (!department) {
      throw new apiError(404, "Department not found");
    }

    const employeeCount = await getDepartmentEmployeeCount(id);
    if (employeeCount > 0) {
      throw new apiError(
        400,
        `Cannot delete department with ${employeeCount} active employee(s). Reassign them first.`
      );
    }

    await Department.findByIdAndDelete(id);

    res.status(200).json(
      new apiResponse(200, "Department deleted successfully", { id })
    );

    logger.info(`User ${req.user.id} deleted department: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error deleting department:", error);
    throw new apiError(500, "Error deleting department");
  }
});

/**
 * @desc    Get department statistics overview
 * @route   GET /api/departments/stats/overview
 * @access  Super Admin, Admin, HR
 */
export const getDepartmentStatistics = asyncHandler(async (req, res) => {
  if (!["Super Admin", "Admin", "HR"].includes(req.user.role)) {
    throw new apiError(403, "Not authorized to view department statistics");
  }

  try {
    const [totalDepartments, departmentsWithoutManager, employeesByDepartment] =
      await Promise.all([
        Department.countDocuments(),

        Department.countDocuments({ manager: null }),

        Employee.aggregate([
          { $match: { status: { $ne: "Terminated" } } },
          {
            $lookup: {
              from: "departments",
              localField: "department",
              foreignField: "_id",
              as: "dept",
            },
          },
          { $unwind: "$dept" },
          { $group: { _id: "$dept.name", count: { $sum: 1 } } },
        ]),
      ]);

    res.status(200).json(
      new apiResponse(200, "Department statistics retrieved successfully", {
        total: totalDepartments,
        withoutManager: departmentsWithoutManager,
        employeesByDepartment: employeesByDepartment.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      })
    );

    logger.info(`User ${req.user.id} viewed department statistics`);
  } catch (error) {
    logger.error("Error fetching department statistics:", error);
    throw new apiError(500, "Error fetching department statistics");
  }
});

export default {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  assignDepartmentManager,
  deleteDepartment,
  getDepartmentStatistics,
};