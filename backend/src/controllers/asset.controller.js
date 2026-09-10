import Asset from "../models/Asset.model.js";
import Employee from "../models/Employee.model.js";
import Department from "../models/Department.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * Asset Controller
 * Manages all asset-related operations with proper RBAC and validation
 * 
 * Role-based Access:
 * - Super Admin & Admin: Full CRUD
 * - Manager: Create, Read, Update (own team), Assign
 * - HR: Read-only
 * - Employee: Read-only (assigned assets)
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Check if user has permission for asset operations
 */
const checkAssetPermission = (userRole, operation) => {
  const permissions = {
    create: ["Super Admin", "Admin"],
    update: ["Super Admin", "Admin", "Manager"],
    delete: ["Super Admin", "Admin"],
    assign: ["Super Admin", "Admin", "Manager"],
    read: ["Super Admin", "Admin", "Manager", "HR", "Employee"],
  };

  return permissions[operation]?.includes(userRole) || false;
};

/**
 * Build filter query based on user role and permissions
 */
const buildFilterQuery = (userRole, userId, filters = {}) => {
  const query = { isActive: true };

  // Role-based query filtering
  if (userRole === "Employee") {
    query.assignedTo = userId;
  }

  // Apply additional filters
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.department) query.department = filters.department;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { serialNumber: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
  }

  return query;
};

/**
 * Calculate depreciation based on type and asset age
 */
const calculateDepreciation = (asset) => {
  if (asset.depreciationType === "None" || !asset.cost) {
    return 0;
  }

  const ageInYears = (new Date() - asset.purchaseDate) / (1000 * 60 * 60 * 24 * 365);

  switch (asset.depreciationType) {
    case "Straight-Line":
      return Math.min(asset.cost, (asset.cost / asset.usefulLifeYears) * ageInYears);

    case "Declining-Balance":
      const rate = asset.depreciationRate / 100;
      return asset.cost * (1 - Math.pow(1 - rate, ageInYears));

    default:
      return 0;
  }
};

// ===== PUBLIC CONTROLLER METHODS =====

/**
 * @desc    Get all assets with filtering, pagination, and sorting
 * @route   GET /api/assets
 * @access  Manager, HR, Super Admin, Admin, Employee (limited)
 */
export const getAllAssets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status,
    type,
    assignedTo,
    department,
    search,
  } = req.query;

  // Permission check
  if (!checkAssetPermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view assets");
  }

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const filterQuery = buildFilterQuery(req.user.role, req.user.id, {
    status,
    type,
    assignedTo,
    department,
    search,
  });

  try {
    // Execute query with pagination and sorting
    const [assets, totalCount] = await Promise.all([
      Asset.find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Asset.countDocuments(filterQuery),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(
      new apiResponse(200, "Assets retrieved successfully", {
        assets,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: totalPages,
          limit: limitNum,
        },
      })
    );

    logger.info(`${req.user.role} fetched assets - page: ${pageNum}, limit: ${limitNum}`);
  } catch (error) {
    logger.error("Error fetching assets:", error);
    throw new apiError(500, "Error fetching assets");
  }
});

/**
 * @desc    Get single asset by ID
 * @route   GET /api/assets/:id
 * @access  Manager, HR, Super Admin, Admin, Employee (own assets)
 */
export const getAssetById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  // Permission check
  if (!checkAssetPermission(req.user.role, "read")) {
    throw new apiError(403, "Not authorized to view this asset");
  }

  try {
    const asset = await Asset.findById(id);

    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    // Employee can only view their assigned assets
    if (req.user.role === "Employee" && asset.assignedTo?.toString() !== req.user.id) {
      throw new apiError(403, "Not authorized to view this asset");
    }

    // Calculate current depreciation
    asset.accumulatedDepreciation = calculateDepreciation(asset);
    asset.bookValue = Math.max(0, asset.cost - asset.accumulatedDepreciation);

    res.status(200).json(
      new apiResponse(200, "Asset retrieved successfully", asset)
    );

    logger.info(`User ${req.user.id} viewed asset ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching asset:", error);
    throw new apiError(500, "Error fetching asset");
  }
});

/**
 * @desc    Create new asset
 * @route   POST /api/assets
 * @access  Super Admin, Admin
 */
export const createAsset = asyncHandler(async (req, res) => {
  // Permission check
  if (!checkAssetPermission(req.user.role, "create")) {
    throw new apiError(403, "Not authorized to create assets");
  }

  const {
    name,
    type,
    description,
    serialNumber,
    modelNumber,
    manufacturer,
    cost,
    purchaseDate,
    depreciationType,
    usefulLifeYears,
    depreciationRate,
    warrantyExpiryDate,
    maintenanceInterval,
    location,
    department,
    tags,
    notes,
  } = req.body;

  // Validation
  if (!name || !type || !purchaseDate || cost === undefined) {
    throw new apiError(400, "Missing required fields: name, type, purchaseDate, cost");
  }

  if (cost < 0) {
    throw new apiError(400, "Asset cost cannot be negative");
  }

  try {
    // Check for duplicate serial number
    if (serialNumber) {
      const existingAsset = await Asset.findOne({ serialNumber });
      if (existingAsset) {
        throw new apiError(400, "Asset with this serial number already exists");
      }
    }

    // Validate department if provided
    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        throw new apiError(404, "Department not found");
      }
    }

    // Create new asset
    const newAsset = await Asset.create({
      name: name.trim(),
      type,
      description: description?.trim(),
      serialNumber: serialNumber?.trim(),
      modelNumber: modelNumber?.trim(),
      manufacturer: manufacturer?.trim(),
      cost,
      purchaseDate: new Date(purchaseDate),
      depreciationType: depreciationType || "Straight-Line",
      usefulLifeYears: usefulLifeYears || 5,
      depreciationRate: depreciationRate || 0,
      warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : null,
      maintenanceInterval: maintenanceInterval || 90,
      location: location || "Main Office",
      department: department || null,
      tags: tags || [],
      notes: notes?.trim(),
      createdBy: req.user.id,
    });

    await newAsset.populate("assignedTo department");

    res.status(201).json(
      new apiResponse(201, "Asset created successfully", newAsset)
    );

    logger.info(`Super Admin/Admin ${req.user.id} created asset: ${newAsset._id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error creating asset:", error);
    throw new apiError(500, "Error creating asset");
  }
});

/**
 * @desc    Update asset details
 * @route   PUT /api/assets/:id
 * @access  Super Admin, Admin, Manager
 */
export const updateAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  // Permission check
  if (!checkAssetPermission(req.user.role, "update")) {
    throw new apiError(403, "Not authorized to update assets");
  }

  const updateData = req.body;

  // Fields that cannot be updated
  const protectedFields = ["_id", "createdBy", "createdAt"];
  protectedFields.forEach((field) => delete updateData[field]);

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    // Trim string fields
    Object.keys(updateData).forEach((key) => {
      if (typeof updateData[key] === "string") {
        updateData[key] = updateData[key].trim();
      }
    });

    // Validate specific fields
    if (updateData.cost !== undefined && updateData.cost < 0) {
      throw new apiError(400, "Asset cost cannot be negative");
    }

    if (updateData.serialNumber && updateData.serialNumber !== asset.serialNumber) {
      const existingAsset = await Asset.findOne({ serialNumber: updateData.serialNumber });
      if (existingAsset) {
        throw new apiError(400, "Asset with this serial number already exists");
      }
    }

    if (updateData.department) {
      const deptExists = await Department.findById(updateData.department);
      if (!deptExists) {
        throw new apiError(404, "Department not found");
      }
    }

    // Update asset
    const updatedAsset = await Asset.findByIdAndUpdate(
      id,
      {
        ...updateData,
        lastModifiedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate("assignedTo department");

    res.status(200).json(
      new apiResponse(200, "Asset updated successfully", updatedAsset)
    );

    logger.info(`User ${req.user.id} updated asset: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating asset:", error);
    throw new apiError(500, "Error updating asset");
  }
});

/**
 * @desc    Delete asset (soft delete)
 * @route   DELETE /api/assets/:id
 * @access  Super Admin, Admin
 */
export const deleteAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  // Permission check
  if (!checkAssetPermission(req.user.role, "delete")) {
    throw new apiError(403, "Not authorized to delete assets");
  }

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    // Soft delete
    const deletedAsset = await Asset.findByIdAndUpdate(
      id,
      {
        isActive: false,
        status: "Retired",
        lastModifiedBy: req.user.id,
      },
      { new: true }
    );

    res.status(200).json(
      new apiResponse(200, "Asset deleted successfully", deletedAsset)
    );

    logger.info(`User ${req.user.id} deleted asset: ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error deleting asset:", error);
    throw new apiError(500, "Error deleting asset");
  }
});

/**
 * @desc    Assign asset to employee
 * @route   PUT /api/assets/:id/assign
 * @access  Super Admin, Admin, Manager
 */
export const assignAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo, assignmentNote } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  // Permission check
  if (!checkAssetPermission(req.user.role, "assign")) {
    throw new apiError(403, "Not authorized to assign assets");
  }

  if (!assignedTo?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  try {
    // Verify employee exists
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    // Verify asset exists and is available
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    if (asset.status === "Retired") {
      throw new apiError(400, "Cannot assign a retired asset");
    }

    // Update asset assignment
    const updatedAsset = await Asset.findByIdAndUpdate(
      id,
      {
        assignedTo,
        assignedDate: new Date(),
        assignmentNote: assignmentNote?.trim() || null,
        status: "Assigned",
        statusChangedAt: new Date(),
        lastModifiedBy: req.user.id,
      },
      { new: true }
    ).populate("assignedTo department");

    res.status(200).json(
      new apiResponse(200, "Asset assigned successfully", updatedAsset)
    );

    logger.info(
      `User ${req.user.id} assigned asset ${id} to employee ${assignedTo}`
    );
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error assigning asset:", error);
    throw new apiError(500, "Error assigning asset");
  }
});

/**
 * @desc    Unassign asset from employee
 * @route   PUT /api/assets/:id/unassign
 * @access  Super Admin, Admin, Manager
 */
export const unassignAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  // Permission check
  if (!checkAssetPermission(req.user.role, "assign")) {
    throw new apiError(403, "Not authorized to unassign assets");
  }

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    const updatedAsset = await Asset.findByIdAndUpdate(
      id,
      {
        assignedTo: null,
        assignedDate: null,
        assignmentNote: null,
        status: "Available",
        statusChangedAt: new Date(),
        lastModifiedBy: req.user.id,
      },
      { new: true }
    ).populate("department");

    res.status(200).json(
      new apiResponse(200, "Asset unassigned successfully", updatedAsset)
    );

    logger.info(`User ${req.user.id} unassigned asset ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error unassigning asset:", error);
    throw new apiError(500, "Error unassigning asset");
  }
});

/**
 * @desc    Change asset status
 * @route   PUT /api/assets/:id/status
 * @access  Super Admin, Admin, Manager
 */
export const updateAssetStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  if (!status) {
    throw new apiError(400, "Status is required");
  }

  const validStatuses = ["Available", "Assigned", "Maintenance", "Retired", "Lost", "Damaged"];
  if (!validStatuses.includes(status)) {
    throw new apiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    const updateFields = {
      status,
      statusChangedAt: new Date(),
      lastModifiedBy: req.user.id,
    };

    // Add reason/note for status changes to Maintenance, Lost, Damaged
    if (reason && ["Maintenance", "Lost", "Damaged"].includes(status)) {
      updateFields.notes = reason.trim();
    }

    // If status changes to Available, clear assignment
    if (status === "Available") {
      updateFields.assignedTo = null;
      updateFields.assignmentNote = null;
    }

    const updatedAsset = await Asset.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).populate("assignedTo department");

    res.status(200).json(
      new apiResponse(200, `Asset status updated to ${status}`, updatedAsset)
    );

    logger.info(`User ${req.user.id} changed asset ${id} status to ${status}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error updating asset status:", error);
    throw new apiError(500, "Error updating asset status");
  }
});

/**
 * @desc    Add maintenance record to asset
 * @route   POST /api/assets/:id/maintenance
 * @access  Super Admin, Admin, Manager
 */
export const addMaintenance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, cost, performedBy } = req.body;

  if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid asset ID format");
  }

  if (!description?.trim()) {
    throw new apiError(400, "Maintenance description is required");
  }

  try {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw new apiError(404, "Asset not found");
    }

    // Calculate next maintenance due date
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + asset.maintenanceInterval);

    const updatedAsset = await Asset.findByIdAndUpdate(
      id,
      {
        $push: {
          maintenanceHistory: {
            date: new Date(),
            description: description.trim(),
            cost: cost || 0,
            performedBy: performedBy?.trim() || "Unknown",
          },
        },
        lastMaintenanceDate: new Date(),
        nextMaintenanceDueDate: nextDueDate,
        lastModifiedBy: req.user.id,
      },
      { new: true }
    ).populate("assignedTo department");

    res.status(200).json(
      new apiResponse(200, "Maintenance record added successfully", updatedAsset)
    );

    logger.info(`User ${req.user.id} added maintenance record to asset ${id}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error adding maintenance record:", error);
    throw new apiError(500, "Error adding maintenance record");
  }
});

/**
 * @desc    Get assets assigned to specific employee
 * @route   GET /api/assets/employee/:employeeId
 * @access  Super Admin, Admin, Manager, HR
 */
export const getAssetsByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!employeeId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new apiError(400, "Invalid employee ID format");
  }

  try {
    const employee = await Employee.findById(employeeId).populate("user", "fullname email");
    if (!employee) {
      throw new apiError(404, "Employee not found");
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [assets, totalCount] = await Promise.all([
      Asset.find({ assignedTo: employeeId, isActive: true })
        .sort("-assignedDate")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Asset.countDocuments({ assignedTo: employeeId, isActive: true }),
    ]);

    res.status(200).json(
      new apiResponse(200, "Assets retrieved successfully", {
        employee: {
          id: employee._id,
          name: employee.user?.fullname || "Unknown",
          email: employee.user?.email || "",
        },
        assets,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum),
        },
      })
    );

    logger.info(`User ${req.user.id} viewed assets for employee ${employeeId}`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error fetching employee assets:", error);
    throw new apiError(500, "Error fetching employee assets");
  }
});

/**
 * @desc    Get asset statistics and insights
 * @route   GET /api/assets/stats/overview
 * @access  Super Admin, Admin, Manager, HR
 */
export const getAssetStatistics = asyncHandler(async (req, res) => {
  try {
    const [
      totalAssets,
      assetsByStatus,
      assetsByType,
      maintenanceDue,
      warrantyExpiring,
      depreciationData,
    ] = await Promise.all([
      Asset.countDocuments({ isActive: true }),

      Asset.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Asset.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),

      Asset.countDocuments({
        nextMaintenanceDueDate: { $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        isActive: true,
      }),

      Asset.countDocuments({
        warrantyExpiryDate: { $lt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
        isActive: true,
      }),

      Asset.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$cost" },
            totalDepreciation: { $sum: "$accumulatedDepreciation" },
            totalBookValue: { $sum: "$bookValue" },
          },
        },
      ]),
    ]);

    res.status(200).json(
      new apiResponse(200, {
        total: totalAssets,
        byStatus: assetsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: assetsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        maintenanceDueIn30Days: maintenanceDue,
        warrantyExpiringIn60Days: warrantyExpiring,
        financial: depreciationData[0] || {
          totalCost: 0,
          totalDepreciation: 0,
          totalBookValue: 0,
        },
      }, "Asset statistics retrieved successfully")
    );

    logger.info(`User ${req.user.id} viewed asset statistics`);
  } catch (error) {
    logger.error("Error fetching asset statistics:", error);
    throw new apiError(500, "Error fetching asset statistics");
  }
});

/**
 * @desc    Export assets to CSV
 * @route   GET /api/assets/export/csv
 * @access  Super Admin, Admin, Manager, HR
 */
export const exportAssetsToCSV = asyncHandler(async (req, res) => {
  const { status, type, department } = req.query;

  const filterQuery = { isActive: true };
  if (status) filterQuery.status = status;
  if (type) filterQuery.type = type;
  if (department) filterQuery.department = department;

  try {
    const assets = await Asset.find(filterQuery)
      .populate({
        path: "assignedTo",
        select: "user",
        populate: { path: "user", select: "fullname email" }
      })
      .populate("department", "name")
      .lean();

    if (assets.length === 0) {
      throw new apiError(404, "No assets found matching criteria");
    }

    // Prepare CSV headers
    const headers = [
      "Asset Name",
      "Type",
      "Serial Number",
      "Status",
      "Assigned To",
      "Purchase Date",
      "Cost",
      "Book Value",
      "Warranty Expiry",
      "Next Maintenance",
      "Department",
      "Created Date",
    ];

    // Prepare CSV rows
    const rows = assets.map((asset) => [
      asset.name,
      asset.type,
      asset.serialNumber || "N/A",
      asset.status,
      asset.assignedTo?.user ? asset.assignedTo.user.fullname : "Unassigned",
      new Date(asset.purchaseDate).toLocaleDateString(),
      asset.cost,
      asset.bookValue || 0,
      asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toLocaleDateString() : "N/A",
      asset.nextMaintenanceDueDate ? new Date(asset.nextMaintenanceDueDate).toLocaleDateString() : "N/A",
      asset.department?.name || "N/A",
      new Date(asset.createdAt).toLocaleDateString(),
    ]);

    // Create CSV content
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=assets-export.csv");
    res.send(csvContent);

    logger.info(`User ${req.user.id} exported assets to CSV`);
  } catch (error) {
    if (error instanceof apiError) throw error;
    logger.error("Error exporting assets:", error);
    throw new apiError(500, "Error exporting assets to CSV");
  }
});

export default {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
  updateAssetStatus,
  addMaintenance,
  getAssetsByEmployee,
  getAssetStatistics,
  exportAssetsToCSV,
};