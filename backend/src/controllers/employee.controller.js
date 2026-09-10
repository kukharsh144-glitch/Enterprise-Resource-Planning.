import Employee from "../models/Employee.model.js";
import User from "../models/User.model.js";
import Department from "../models/Department.model.js";
import Asset from "../models/Asset.model.js";
import Project from "../models/Project.model.js";
import Leave from "../models/Leave.model.js";
import Payroll from "../models/Payroll.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * Employee Controller
 * Manages all employee-related operations with RBAC and validation
 * 
 * Role-based Access:
 * - Super Admin & Admin: Full CRUD + bulk operations
 * - Manager: Read, limited Update (own team)
 * - HR: Full CRUD + recruitment operations
 * - Accountant: Read-only
 * - Employee: Read-only (own profile + team)
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Check if user has permission for employee operations
 */
const checkEmployeePermission = (userRole, operation) => {
  const permissions = {
    create: ["Super Admin", "Admin", "HR"],
    update: ["Super Admin", "Admin", "HR", "Manager"],
    delete: ["Super Admin", "Admin"],
    read: ["Super Admin", "Admin", "HR", "Manager", "Accountant", "Employee"],
    manageStatus: ["Super Admin", "Admin", "HR"],
    bulkOperation: ["Super Admin", "Admin"],
  };

  return permissions[operation]?.includes(userRole) || false;
};

/**
 * Build filter query based on user role
 */
const buildEmployeeFilterQuery = (userRole, userId, filters = {}) => {
  const query = {};

  // Role-based query filtering
  if (userRole === "Employee") {
    query.user = userId; // Employees can only see their own profile
  }

  if (userRole === "Manager") {
    // Managers can see their department and reports
    // This would need additional logic to fetch manager's department
  }

  // Apply additional filters
  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;
  if (filters.designation) query.designation = new RegExp(filters.designation, "i");
  if (filters.search) {
    query.$or = [
      { designation: { $regex: filters.search, $options: "i" } },
      { salaryBand: { $regex: filters.search, $options: "i" } },
    ];
  }

  return query;
};

/**
 * Calculate employee workload across projects
 */
const calculateEmployeeWorkload = async (employeeId) => {
  try {
    const projectAllocation = await Project.aggregate([
      {
        $lookup: {
          from: "project_members",
          localField: "_id",
          foreignField: "project",
          as: "members",
        },
      },
      {
        $unwind: "$members",
      },
      {
        $match: {
          "members.employee": employeeId,
          status: "Active",
        },
      },
      {
        $group: {
          _id: null,
          totalAllocationPercent: { $sum: "$members.allocationPercent" },
          projectCount: { $sum: 1 },
        },
      },
    ]);

    return projectAllocation[0] || { totalAllocationPercent: 0, projectCount: 0 };
  } catch (error) {
    logger.error("Error calculating employee workload:", error);
    return { totalAllocationPercent: 0, projectCount: 0 };
  }
};

/**
 * Get employee leave summary
 */
const getEmployeeLeaveSummary = async (employeeId) => {
  try {
    const currentYear = new Date().getFullYear();
    const leaves = await Leave.aggregate([
      {
        $match: {
          employee: employeeId,
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
          },
        },
      },
    ]);

    return leaves;
  } catch (error) {
    logger.error("Error fetching employee leave summary:", error);
    return [];
  }
};

/**
 * Get employee assets assigned
 */
const getEmployeeAssets = async (employeeId) => {
  try {
    return await Asset.find({ assignedTo: employeeId, isActive: true })
      .select("name type status bookValue")
      .lean();
  } catch (error) {
    logger.error("Error fetching employee assets:", error);
    return [];
  }
};

// ===== PUBLIC CONTROLLER METHODS =====

/**
 * @desc    Get all employees with filtering, pagination, and sorting
 * @route   GET /api/employees
 * @access  Super Admin, Admin, HR, Manager, Accountant, Employee (limited)
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status,
    department,
    designation,
    search,
  } = req.query;

  // Permission check
  if (!checkEmployeePermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view employees");
  }

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filterQuery = buildEmployeeFilterQuery(req.user.role, req.user.id, {
    status,
    department,
    designation,
    search,
  });

  try {
    const [employees, totalCount] = await Promise.all([
      Employee.find(filterQuery)
        .populate("user", "email fullname")
        .populate("department", "name")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Employee.countDocuments(filterQuery),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(
      new apiResponse(200, {
        employees,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: totalPages,
          limit: limitNum,
        },
      }, "Employees retrieved successfully")
    );

    logger.info(
      `${req.user.role} fetched employees - page: ${pageNum}, limit: ${limitNum}`
    );
  } catch (error) {
    logger.error("Error fetching employees:", error);
    throw new apiError(500, "Error fetching employees");
  }
});

/**
 * @desc    Get single employee by ID with comprehensive details
 * @route   GET /api/employees/:id
 * @access  Super Admin, Admin, HR, Manager, Employee (own profile)
 */
export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  // Permission check
  if (!checkEmployeePermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view this employee");
  }

  try {
    const employee = await Employee.findById(id)
      .populate("user", "email fullname phone")
      .populate({
        path: "department",
        select: "name description manager",
        populate: {
          path: "manager",
          select: "user",
          populate: {
            path: "user",
            select: "fullname"
          }
        }
      });

    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    // Check if employee trying to access own profile
    if (
      req.user.role === "Employee" &&
      employee.user._id.toString() !== req.user.id
    ) {
      throw new apiError(403, "Not authorized to view this employee");
    }

    // Fetch additional data in parallel
    const [workload, leaveSummary, assets] = await Promise.all([
      calculateEmployeeWorkload(id),
      getEmployeeLeaveSummary(id),
      getEmployeeAssets(id),
    ]);

    // Calculate tenure
    const now = new Date();
    const joinDate = new Date(employee.dateOfJoining);
    const tenureInYears = ((now - joinDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

    const enrichedEmployee = {
      ...employee.toObject(),
      tenure: {
        years: tenureInYears,
        joinDate: employee.dateOfJoining,
      },
      workload: {
        allocationPercent: workload.totalAllocationPercent || 0,
        projectCount: workload.projectCount || 0,
        availableCapacity: 100 - (workload.totalAllocationPercent || 0),
      },
      leavesSummary: leaveSummary,
      assignedAssets: assets,
    };

    res.status(200).json(
      new apiResponse(200, "Employee retrieved successfully", enrichedEmployee)
    );

    logger.info(`User ${req.user.id} viewed employee ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching employee:", error);
    throw new apiError(500, "Error fetching employee");
  }
});

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Super Admin, Admin, HR
 */
export const createEmployee = asyncHandler(async (req, res) => {
  // Permission check
  if (!checkEmployeePermission(req.user.role, "create")) {
    throw new apiError(403, "Not authorized to create employees");
  }

  const {
    user,
    department,
    designation,
    experience,
    salaryBand,
    skills,
    weeklyCapacityHours,
    status,
    dateOfJoining,
    address,
    documents,
    avatarScale,
    avatarPositionX,
    avatarPositionY,
    // New fields
    employeeId,
    phone,
    alternatePhone,
    dateOfBirth,
    gender,
    maritalStatus,
    nationality,
    bloodGroup,
    religion,
    employmentType,
    reportingManager,
    workLocation,
    probationPeriod,
    noticePeriod,
    workingHoursPerDay,
    payrollGroup,
    currentAddress,
    permanentAddress,
    sameAsCurrentAddress,
    educationQualification,
    previousCompany,
    notes,
  } = req.body;

  // Validation
  if (!user || !department || !designation || !employeeId || !phone || !dateOfBirth || !gender || !maritalStatus || !employmentType || !workLocation || !currentAddress || !permanentAddress) {
    throw new apiError(
      400,
      "Missing required fields. Please fill all required fields in personal, employment, address and documents sections."
    );
  }

  if (experience !== undefined && experience < 0) {
    throw new apiError(400, "Experience cannot be negative");
  }

  try {
    // Verify user exists and is not already an employee
    const existingUser = await User.findById(user);
    if (!existingUser) {
      throw new apiError(404, "User not found");
    }

    const existingEmployee = await Employee.findOne({ user });
    if (existingEmployee) {
      throw new apiError(400, "This user is already an employee");
    }

    // Verify department exists
    const deptExists = await Department.findById(department);
    if (!deptExists) {
      throw new apiError(404, "Department not found");
    }

    const salaryBandVal = salaryBand ? salaryBand.trim() : "B2";

    // Validate salary band format
    if (!/^[A-Z0-9]+$/.test(salaryBandVal)) {
      throw new apiError(400, "Salary band format is invalid");
    }

    // Handle file uploads to Cloudinary (optional direct uploads on employee endpoint)
    let avatarUrl = "";
    if (req.files && req.files.avatar && req.files.avatar.length > 0) {
      const avatarFile = req.files.avatar[0];
      if (avatarFile.size > 2 * 1024 * 1024) {
        throw new apiError(400, "Profile picture size exceeds the maximum limit of 2MB.");
      }
      const avatarLocalPath = avatarFile.path;
      const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
      if (uploadedAvatar) {
        avatarUrl = uploadedAvatar.url;
      }
    }

    let uploadedDocuments = [];
    if (req.files && req.files.documents && req.files.documents.length > 0) {
      for (const file of req.files.documents) {
        if (file.size > 5 * 1024 * 1024) {
          throw new apiError(400, `Document "${file.originalname}" exceeds the maximum limit of 5MB.`);
        }
        const uploaded = await uploadOnCloudinary(file.path);
        if (uploaded) {
          uploadedDocuments.push({
            url: uploaded.url,
            name: file.originalname,
          });
        }
      }
    }

    // Create new employee
    const newEmployee = await Employee.create({
      user,
      department,
      designation: designation.trim(),
      experience: experience || 0,
      salaryBand: salaryBandVal.toUpperCase(),
      skills: skills?.map((skill) => skill.trim()) || [],
      weeklyCapacityHours: weeklyCapacityHours || 40,
      status: status || "Active",
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
      avatar: avatarUrl || existingUser.avatar || "",
      documents: uploadedDocuments.length > 0 ? uploadedDocuments : (documents || existingUser.documents || []),
      address: address || existingUser.address || `${currentAddress.city}, ${currentAddress.state}, ${currentAddress.country}`,
      avatarScale: Number(avatarScale) || existingUser.avatarScale || 1,
      avatarPositionX: Number(avatarPositionX) || existingUser.avatarPositionX || 50,
      avatarPositionY: Number(avatarPositionY) || existingUser.avatarPositionY || 50,
      // New fields
      employeeId: employeeId.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone?.trim() || "",
      dateOfBirth: new Date(dateOfBirth),
      gender,
      maritalStatus,
      nationality: nationality?.trim() || "",
      bloodGroup: bloodGroup?.trim() || "",
      religion: religion?.trim() || "",
      employmentType,
      reportingManager: reportingManager || null,
      workLocation,
      probationPeriod: Number(probationPeriod) || 0,
      noticePeriod: Number(noticePeriod) || 0,
      workingHoursPerDay: Number(workingHoursPerDay) || 8,
      payrollGroup: payrollGroup?.trim() || "",
      currentAddress,
      permanentAddress,
      sameAsCurrentAddress: !!sameAsCurrentAddress,
      educationQualification: educationQualification?.trim() || "",
      previousCompany: previousCompany?.trim() || "",
      notes: notes?.trim() || "",
    });

    await newEmployee.populate([
      { path: "user", select: "email fullname" },
      { path: "department", select: "name" },
    ]);

    // Update user role if needed (optional - depends on your system)
    if (existingUser.role === "Super Admin") {
      // Don't change Super Admin role
    } else if (!existingUser.role || existingUser.role === "User") {
      await User.findByIdAndUpdate(user, { role: "Employee" });
    }

    res.status(201).json(
      new apiResponse(201, "Employee created successfully", newEmployee)
    );

    logger.info(`Admin ${req.user.id} created employee: ${newEmployee._id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error creating employee:", error);
    throw new apiError(500, "Error creating employee");
  }
});

/**
 * @desc    Update employee information
 * @route   PUT /api/employees/:id
 * @access  Super Admin, Admin, HR, Manager (limited)
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  // Permission check
  if (!checkEmployeePermission(req.user.role, "update")) {
    throw new apiError(403, "Not authorized to update employees");
  }

  const updateData = req.body;

  // Fields that cannot be updated
  const protectedFields = ["_id", "user", "createdAt"];
  protectedFields.forEach((field) => delete updateData[field]);

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    // Managers can only update their own department employees (future implementation)
    if (req.user.role === "Manager") {
      // Add department check logic here if needed
    }

    // Trim string fields
    Object.keys(updateData).forEach((key) => {
      if (typeof updateData[key] === "string") {
        updateData[key] = updateData[key].trim();
      }
    });

    // Validate specific fields
    if (updateData.experience !== undefined && updateData.experience < 0) {
      throw new apiError(400, "Experience cannot be negative");
    }

    if (updateData.salaryBand && !/^[A-Z0-9]+$/.test(updateData.salaryBand)) {
      throw new apiError(400, "Salary band format is invalid");
    }

    if (
      updateData.weeklyCapacityHours &&
      (updateData.weeklyCapacityHours < 1 || updateData.weeklyCapacityHours > 168)
    ) {
      throw new apiError(
        400,
        "Weekly capacity hours must be between 1 and 168"
      );
    }

    if (updateData.department) {
      const deptExists = await Department.findById(updateData.department);
      if (!deptExists) {
        throw new apiError(404, "Department not found");
      }
    }

    if (updateData.skills && Array.isArray(updateData.skills)) {
      updateData.skills = updateData.skills.map((skill) => skill.trim());
    }

    // Process file updates during employee details edit
    if (req.files) {
      if (req.files.avatar && req.files.avatar.length > 0) {
        const avatarFile = req.files.avatar[0];
        if (avatarFile.size > 2 * 1024 * 1024) {
          throw new apiError(400, "Profile picture size exceeds the maximum limit of 2MB.");
        }
        const avatarLocalPath = avatarFile.path;
        const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
        if (uploadedAvatar) {
          updateData.avatar = uploadedAvatar.url;
          await User.findByIdAndUpdate(employee.user, { $set: { avatar: uploadedAvatar.url } });
        }
      }
      if (req.files.documents && req.files.documents.length > 0) {
        const uploadedDocs = [];
        for (const file of req.files.documents) {
          if (file.size > 5 * 1024 * 1024) {
            throw new apiError(400, `Document "${file.originalname}" exceeds the maximum limit of 5MB.`);
          }
          const uploaded = await uploadOnCloudinary(file.path);
          if (uploaded) {
            uploadedDocs.push({
              url: uploaded.url,
              name: file.originalname,
            });
          }
        }
        if (uploadedDocs.length > 0) {
          updateData.documents = [...(employee.documents || []), ...uploadedDocs];
          await User.findByIdAndUpdate(employee.user, { $set: { documents: updateData.documents } });
        }
      }
    }

    // Fallback if URLs passed as body parameters directly
    if (req.body.avatar) updateData.avatar = req.body.avatar;
    if (req.body.documents) {
      updateData.documents = req.body.documents;
      await User.findByIdAndUpdate(employee.user, { $set: { documents: req.body.documents } });
    }
    if (req.body.address) {
      updateData.address = req.body.address;
      await User.findByIdAndUpdate(employee.user, { $set: { address: req.body.address } });
    }
    if (req.body.avatarScale !== undefined) {
      updateData.avatarScale = Number(req.body.avatarScale);
      await User.findByIdAndUpdate(employee.user, { $set: { avatarScale: Number(req.body.avatarScale) } });
    }
    if (req.body.avatarPositionX !== undefined) {
      updateData.avatarPositionX = Number(req.body.avatarPositionX);
      await User.findByIdAndUpdate(employee.user, { $set: { avatarPositionX: Number(req.body.avatarPositionX) } });
    }
    if (req.body.avatarPositionY !== undefined) {
      updateData.avatarPositionY = Number(req.body.avatarPositionY);
      await User.findByIdAndUpdate(employee.user, { $set: { avatarPositionY: Number(req.body.avatarPositionY) } });
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "user", select: "email fullname" },
      { path: "department", select: "name" },
    ]);

    res.status(200).json(
      new apiResponse(200, "Employee updated successfully", updatedEmployee)
    );

    logger.info(`User ${req.user.id} updated employee: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating employee:", error);
    throw new apiError(500, "Error updating employee");
  }
});

/**
 * @desc    Delete employee (soft delete)
 * @route   DELETE /api/employees/:id
 * @access  Super Admin, Admin
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  // Permission check
  if (!checkEmployeePermission(req.user.role, "delete")) {
    throw new apiError(403, "Not authorized to delete employees");
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    // Check if employee has active projects or pending leaves
    const [activeProjects, pendingLeaves] = await Promise.all([
      Project.countDocuments({
        "members.employee": id,
        status: "Active",
      }),
      Leave.countDocuments({
        employee: id,
        status: { $in: ["Applied", "Approved"] },
      }),
    ]);

    if (activeProjects > 0) {
      throw new apiError(
        400,
        `Cannot delete employee with ${activeProjects} active project(s). Reassign tasks first.`
      );
    }

    if (pendingLeaves > 0) {
      throw new apiError(
        400,
        `Cannot delete employee with ${pendingLeaves} pending leave(s).`
      );
    }

    // Soft delete by marking as Terminated
    const deletedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        status: "Terminated",
      },
      { new: true }
    );

    res.status(200).json(
      new apiResponse(200, "Employee deleted successfully", deletedEmployee)
    );

    logger.info(`User ${req.user.id} deleted employee: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error deleting employee:", error);
    throw new apiError(500, "Error deleting employee");
  }
});

/**
 * @desc    Change employee status (Active, On Leave, Terminated)
 * @route   PUT /api/employees/:id/status
 * @access  Super Admin, Admin, HR
 */
export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  if (!status) {
    throw new apiError(400, "Status is required");
  }

  const validStatuses = ["Active", "On Leave", "Terminated"];
  if (!validStatuses.includes(status)) {
    throw new apiError(
      400,
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    );
  }

  // Permission check
  if (!checkEmployeePermission(req.user.role, "manageStatus")) {
    throw new apiError(403, "Not authorized to change employee status");
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate([
      { path: "user", select: "email fullname" },
      { path: "department", select: "name" },
    ]);

    res.status(200).json(
      new apiResponse(200, `Employee status updated to ${status}`, updatedEmployee)
    );

    logger.info(`User ${req.user.id} changed employee ${id} status to ${status}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating employee status:", error);
    throw new apiError(500, "Error updating employee status");
  }
});

/**
 * @desc    Get employees by department
 * @route   GET /api/employees/department/:departmentId
 * @access  Super Admin, Admin, HR, Manager
 */
export const getEmployeesByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  if (!departmentId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid department ID format");
  }

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new apiError(404, "Department not found");
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filterQuery = { department: departmentId };
    if (status) filterQuery.status = status;

    const [employees, totalCount] = await Promise.all([
      Employee.find(filterQuery)
        .populate("user", "email fullname")
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Employee.countDocuments(filterQuery),
    ]);

    res.status(200).json(
      new apiResponse(200, "Department employees retrieved successfully", {
        department: {
          id: department._id,
          name: department.name,
        },
        employees,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
        },
      })
    );

    logger.info(
      `User ${req.user.id} fetched employees from department ${departmentId}`
    );
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching department employees:", error);
    throw new apiError(500, "Error fetching department employees");
  }
});

/**
 * @desc    Get employee profile details (for employees viewing their own profile)
 * @route   GET /api/employees/profile/me
 * @access  All authenticated users
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id })
      .populate("user", "email fullname phone")
      .populate("department", "name description");

    if (!employee) {
      throw new apiError(404, "Employee profile not found");
    }

    // Fetch additional data
    const [workload, leaveSummary, assets] = await Promise.all([
      calculateEmployeeWorkload(employee._id),
      getEmployeeLeaveSummary(employee._id),
      getEmployeeAssets(employee._id),
    ]);

    const tenureInYears = ((new Date() - new Date(employee.dateOfJoining)) / 
      (1000 * 60 * 60 * 24 * 365)).toFixed(1);

    const enrichedProfile = {
      ...employee.toObject(),
      tenure: {
        years: tenureInYears,
        joinDate: employee.dateOfJoining,
      },
      workload: {
        allocationPercent: workload.totalAllocationPercent || 0,
        projectCount: workload.projectCount || 0,
        availableCapacity: 100 - (workload.totalAllocationPercent || 0),
      },
      leavesSummary: leaveSummary,
      assignedAssets: assets,
    };

    res.status(200).json(
      new apiResponse(200, "My profile retrieved successfully", enrichedProfile)
    );

    logger.info(`Employee ${req.user.id} viewed their profile`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching employee profile:", error);
    throw new apiError(500, "Error fetching employee profile");
  }
});

/**
 * @desc    Update own profile
 * @route   PUT /api/employees/profile/me
 * @access  All authenticated users (limited fields)
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ["skills"];
  const updates = Object.keys(req.body);
  const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidUpdate) {
    throw new apiError(
      400,
      `Invalid updates. Only allowed fields: ${allowedUpdates.join(", ")}`
    );
  }

  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      throw new apiError(404, "Employee profile not found");
    }

    // Update allowed fields
    if (req.body.skills) {
      employee.skills = req.body.skills.map((skill) => skill.trim());
    }

    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id)
      .populate("user", "email fullname")
      .populate("department", "name");

    res.status(200).json(
      new apiResponse(200, "Profile updated successfully", updatedEmployee)
    );

    logger.info(`Employee ${req.user.id} updated their profile`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating employee profile:", error);
    throw new apiError(500, "Error updating employee profile");
  }
});

/**
 * @desc    Get employee workload and allocation details
 * @route   GET /api/employees/:id/workload
 * @access  Super Admin, Admin, HR, Manager
 */
export const getEmployeeWorkload = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  try {
    const employee = await Employee.findById(id).select("weeklyCapacityHours");
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    const workload = await calculateEmployeeWorkload(id);
    const availableCapacity =
      employee.weeklyCapacityHours - (workload.weeklyHoursAllocated || 0);

    const projectDetails = await Project.aggregate([
      {
        $lookup: {
          from: "project_members",
          localField: "_id",
          foreignField: "project",
          as: "members",
        },
      },
      {
        $unwind: "$members",
      },
      {
        $match: {
          "members.employee": id,
          status: "Active",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          allocationPercent: "$members.allocationPercent",
          status: "$members.roleInProject",
        },
      },
    ]);

    res.status(200).json(
      new apiResponse(200, "Employee workload retrieved successfully", {
        employee: {
          id,
          weeklyCapacityHours: employee.weeklyCapacityHours,
        },
        allocation: {
          totalAllocationPercent: workload.totalAllocationPercent || 0,
          availableCapacityPercent: Math.max(
            0,
            100 - (workload.totalAllocationPercent || 0)
          ),
          projectCount: workload.projectCount || 0,
        },
        projects: projectDetails,
      })
    );

    logger.info(`User ${req.user.id} viewed workload for employee ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching employee workload:", error);
    throw new apiError(500, "Error fetching employee workload");
  }
});

/**
 * @desc    Get employee statistics for HR dashboard
 * @route   GET /api/employees/stats/overview
 * @access  Super Admin, Admin, HR
 */
export const getEmployeeStatistics = asyncHandler(async (req, res) => {
  try {
    const [
      totalEmployees,
      employeesByStatus,
      employeesByDepartment,
      newHiresThisMonth,
      terminatedThisMonth,
      highCapacityEmployees,
    ] = await Promise.all([
      Employee.countDocuments(),

      Employee.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Employee.aggregate([
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

      Employee.countDocuments({
        dateOfJoining: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date(),
        },
      }),

      Employee.countDocuments({
        status: "Terminated",
        updatedAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date(),
        },
      }),

      Employee.find({ status: "Active" })
        .select("weeklyCapacityHours")
        .sort("-weeklyCapacityHours")
        .limit(5)
        .lean(),
    ]);

    res.status(200).json(
      new apiResponse(200, {
        total: totalEmployees,
        byStatus: employeesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byDepartment: employeesByDepartment.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        thisMonth: {
          newHires: newHiresThisMonth,
          terminated: terminatedThisMonth,
        },
        topCapacityEmployees: highCapacityEmployees.length,
      }, "Employee statistics retrieved successfully")
    );

    logger.info(`User ${req.user.id} viewed employee statistics`);
  } catch (error) {
    logger.error("Error fetching employee statistics:", error);
    throw new apiError(500, "Error fetching employee statistics");
  }
});

/**
 * @desc    Add skills to employee
 * @route   POST /api/employees/:id/skills
 * @access  Super Admin, Admin, HR, Employee (own profile)
 */
export const addSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { skill } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  if (!skill || !skill.trim()) {
    throw new apiError(400, "Skill is required");
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    const trimmedSkill = skill.trim();

    // Check if skill already exists
    if (employee.skills.includes(trimmedSkill)) {
      throw new apiError(400, "Skill already exists for this employee");
    }

    // Add skill (limit to 50 skills)
    if (employee.skills.length >= 50) {
      throw new apiError(400, "Maximum 50 skills allowed");
    }

    employee.skills.push(trimmedSkill);
    await employee.save();

    const updatedEmployee = await Employee.findById(id)
      .populate("user", "email fullname")
      .populate("department", "name");

    res.status(200).json(
      new apiResponse(200, "Skill added successfully", updatedEmployee)
    );

    logger.info(`Skill '${trimmedSkill}' added to employee ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error adding skill:", error);
    throw new apiError(500, "Error adding skill");
  }
});

/**
 * @desc    Remove skill from employee
 * @route   DELETE /api/employees/:id/skills/:skill
 * @access  Super Admin, Admin, HR, Employee (own profile)
 */
export const removeSkill = asyncHandler(async (req, res) => {
  const { id, skill } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  if (!skill) {
    throw new apiError(400, "Skill is required");
  }

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    const skillIndex = employee.skills.indexOf(decodeURIComponent(skill));
    if (skillIndex === -1) {
      throw new apiError(404, "Skill not found for this employee");
    }

    employee.skills.splice(skillIndex, 1);
    await employee.save();

    const updatedEmployee = await Employee.findById(id)
      .populate("user", "email fullname")
      .populate("department", "name");

    res.status(200).json(
      new apiResponse(200, "Skill removed successfully", updatedEmployee)
    );

    logger.info(`Skill '${skill}' removed from employee ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error removing skill:", error);
    throw new apiError(500, "Error removing skill");
  }
});

/**
 * @desc    Export employees to CSV
 * @route   GET /api/employees/export/csv
 * @access  Super Admin, Admin, HR
 */
export const exportEmployeesToCSV = asyncHandler(async (req, res) => {
  const { status, department } = req.query;

  const filterQuery = {};
  if (status) filterQuery.status = status;
  if (department) filterQuery.department = department;

  try {
    const employees = await Employee.find(filterQuery)
      .populate("user", "fullname email")
      .populate("department", "name")
      .lean();

    if (employees.length === 0) {
      throw new apiError(404, "No employees found matching criteria");
    }

    // Prepare CSV headers
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Department",
      "Designation",
      "Experience",
      "Salary Band",
      "Status",
      "Date of Joining",
      "Weekly Capacity Hours",
      "Skills",
    ];

    // Prepare CSV rows
    const rows = employees.map((emp) => {
      const nameParts = (emp.user?.fullname || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      return [
        firstName,
        lastName,
        emp.user?.email || "",
        emp.department?.name || "",
        emp.designation,
        emp.experience,
        emp.salaryBand,
        emp.status,
        new Date(emp.dateOfJoining).toLocaleDateString(),
        emp.weeklyCapacityHours,
        emp.skills.join("; "),
      ];
    });

    // Create CSV content
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employees-export.csv");
    res.send(csvContent);

    logger.info(`User ${req.user.id} exported employees to CSV`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error exporting employees:", error);
    throw new apiError(500, "Error exporting employees to CSV");
  }
});

export const getRecentActivities = asyncHandler(async (req, res) => {
  const activities = await ActivityLog.find()
    .populate("actor", "fullname avatar email role")
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  const formattedActivities = activities.map(act => {
    const fullname = act.actor?.fullname || "System";
    const initials = fullname.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    
    let description = act.action.replace(/_/g, " ");
    description = description.charAt(0).toUpperCase() + description.slice(1);
    if (act.details && act.details.taskTitle) {
      description += `: "${act.details.taskTitle}"`;
    } else if (act.details && act.details.leaveType) {
      description += ` (${act.details.leaveType})`;
    }

    return {
      name: fullname,
      action: description,
      time: act.timestamp,
      initials: initials,
      bg: act.action.includes("leave") ? "#ef4444" : act.action.includes("project") ? "#10b981" : act.action.includes("task") ? "#3b82f6" : "#a855f7"
    };
  });

  res.status(200).json(
    new apiResponse(200, formattedActivities, "Recent activities retrieved successfully")
  );
});

export default {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  getEmployeesByDepartment,
  getMyProfile,
  updateMyProfile,
  getEmployeeWorkload,
  getEmployeeStatistics,
  getRecentActivities,
  addSkill,
  removeSkill,
  exportEmployeesToCSV,
};