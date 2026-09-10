import { Router } from "express";
import * as assetController from "../controllers/asset.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

/**
 * Asset Management Routes
 * 
 * All routes require JWT authentication
 * Authorization checks are handled within controller methods
 * for granular permission control
 * 
 * Base path: /api/assets
 */

const router = Router();

// ===== MIDDLEWARE CHAIN =====
// Apply JWT verification to all routes
router.use(verifyJWT);

// ===== PUBLIC ROUTES (All authenticated users) =====

/**
 * @route   GET /api/assets
 * @desc    Get all assets with filtering, sorting, and pagination
 * @access  Manager, HR, Super Admin, Admin, Employee (limited)
 * @params  page, limit, sort, status, type, assignedTo, department, search
 */
router.get("/", assetController.getAllAssets);

/**
 * @route   GET /api/assets/stats/overview
 * @desc    Get asset statistics and financial overview
 * @access  Manager, HR, Super Admin, Admin
 * @returns Total assets, breakdown by status/type, maintenance alerts, financial data
 */
router.get("/stats/overview", assetController.getAssetStatistics);

/**
 * @route   GET /api/assets/export/csv
 * @desc    Export assets to CSV file
 * @access  Manager, HR, Super Admin, Admin
 * @params  status, type, department
 */
router.get("/export/csv", assetController.exportAssetsToCSV);

/**
 * @route   GET /api/assets/employee/:employeeId
 * @desc    Get all assets assigned to a specific employee
 * @access  Manager, HR, Super Admin, Admin
 * @params  page, limit
 */
router.get("/employee/:employeeId", assetController.getAssetsByEmployee);

/**
 * @route   GET /api/assets/:id
 * @desc    Get single asset by ID with full details
 * @access  Manager, HR, Super Admin, Admin, Employee (own assets)
 */
router.get("/:id", assetController.getAssetById);

// ===== PROTECTED ROUTES (Admin+) =====

/**
 * @route   POST /api/assets
 * @desc    Create new asset
 * @access  Super Admin, Admin
 * @body    {
 *   name (required), type (required), cost (required), purchaseDate (required),
 *   description, serialNumber, modelNumber, manufacturer,
 *   depreciationType, usefulLifeYears, depreciationRate,
 *   warrantyExpiryDate, maintenanceInterval, location, department, tags, notes
 * }
 */
router.post(
  "/",
  authorize(["Super Admin", "Admin"]),
  assetController.createAsset
);

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset information
 * @access  Super Admin, Admin, Manager
 * @body    Any updatable fields (protected fields automatically excluded)
 */
router.put(
  "/:id",
  authorize(["Super Admin", "Admin", "Manager"]),
  assetController.updateAsset
);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Soft delete asset (marks as inactive)
 * @access  Super Admin, Admin
 */
router.delete(
  "/:id",
  authorize(["Super Admin", "Admin"]),
  assetController.deleteAsset
);

/**
 * @route   PUT /api/assets/:id/assign
 * @desc    Assign asset to employee
 * @access  Super Admin, Admin, Manager
 * @body    {
 *   assignedTo (required): Employee ObjectId,
 *   assignmentNote (optional): Assignment reason
 * }
 */
router.put(
  "/:id/assign",
  authorize(["Super Admin", "Admin", "Manager"]),
  assetController.assignAsset
);

/**
 * @route   PUT /api/assets/:id/unassign
 * @desc    Unassign asset from employee (revert to Available)
 * @access  Super Admin, Admin, Manager
 */
router.put(
  "/:id/unassign",
  authorize(["Super Admin", "Admin", "Manager"]),
  assetController.unassignAsset
);

/**
 * @route   PUT /api/assets/:id/status
 * @desc    Change asset status
 * @access  Super Admin, Admin, Manager
 * @body    {
 *   status (required): Available | Assigned | Maintenance | Retired | Lost | Damaged,
 *   reason (optional): Reason for status change
 * }
 */
router.put(
  "/:id/status",
  authorize(["Super Admin", "Admin", "Manager"]),
  assetController.updateAssetStatus
);

/**
 * @route   POST /api/assets/:id/maintenance
 * @desc    Add maintenance record to asset
 * @access  Super Admin, Admin, Manager
 * @body    {
 *   description (required): Maintenance work description,
 *   cost (optional): Maintenance expense amount,
 *   performedBy (optional): Service provider name
 * }
 */
router.post(
  "/:id/maintenance",
  authorize(["Super Admin", "Admin", "Manager"]),
  assetController.addMaintenance
);

export default router;