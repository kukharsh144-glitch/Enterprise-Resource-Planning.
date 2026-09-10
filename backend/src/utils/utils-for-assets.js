/**
 * Utility Classes and Functions for Asset Management
 * 
 * These utilities support the Asset controller with:
 * - Standardized API responses
 * - Custom error handling
 * - Async error wrapping
 * - Logging
 * - Asset-specific calculations
 */

// ===== API RESPONSE STANDARDIZATION =====

/**
 * Standard API Response Class
 * Ensures consistent response format across all endpoints
 */
export class ApiResponse {
  constructor(statusCode, message = "Success", data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }
}

// ===== CUSTOM ERROR HANDLING =====

/**
 * Custom API Error Class
 * Extends Error with HTTP status codes and consistent formatting
 */
export class ApiError extends Error {
  constructor(statusCode, message = "An error occurred", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ===== ASYNC HANDLER WRAPPER =====

/**
 * Wraps async route handlers to catch errors
 * Eliminates try-catch boilerplate in controller methods
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// ===== LOGGING SERVICE =====

/**
 * Logger Service
 * Provides structured logging with different levels
 */
export class Logger {
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    if (level === "error") {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  info(message, data) {
    this.log("info", message, data);
  }

  error(message, error) {
    this.log("error", message, {
      error: error?.message || error,
      stack: error?.stack,
    });
  }

  warn(message, data) {
    this.log("warn", message, data);
  }
}

export const logger = new Logger();

// ===== ASSET-SPECIFIC UTILITIES =====

/**
 * Asset Depreciation Calculator
 * Handles different depreciation methods
 */
export class DepreciationCalculator {
  /**
   * Calculate depreciation based on method
   * @param {Object} asset - Asset object with depreciation settings
   * @returns {Object} - Depreciation details
   */
  static calculate(asset) {
    if (asset.depreciationType === "None" || !asset.cost) {
      return {
        type: "None",
        accumulatedDepreciation: 0,
        bookValue: asset.cost,
        deprecationPercentage: 0,
      };
    }

    const ageInYears = this.getAssetAge(asset.purchaseDate);

    let accumulatedDepreciation = 0;

    switch (asset.depreciationType) {
      case "Straight-Line":
        accumulatedDepreciation = this.calculateStraightLine(
          asset.cost,
          asset.usefulLifeYears,
          ageInYears
        );
        break;

      case "Declining-Balance":
        accumulatedDepreciation = this.calculateDecliningBalance(
          asset.cost,
          asset.depreciationRate,
          ageInYears
        );
        break;

      case "Units-of-Production":
        // Would need usage data - return accumulated depreciation from database
        accumulatedDepreciation = asset.accumulatedDepreciation || 0;
        break;

      default:
        accumulatedDepreciation = 0;
    }

    // Cap accumulated depreciation at cost
    accumulatedDepreciation = Math.min(accumulatedDepreciation, asset.cost);

    const bookValue = Math.max(0, asset.cost - accumulatedDepreciation);
    const deprecationPercentage =
      asset.cost > 0 ? (accumulatedDepreciation / asset.cost) * 100 : 0;

    return {
      type: asset.depreciationType,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      deprecationPercentage: deprecationPercentage.toFixed(2),
    };
  }

  /**
   * Straight-line depreciation calculation
   */
  static calculateStraightLine(cost, usefulLifeYears, ageInYears) {
    if (usefulLifeYears <= 0) return 0;
    const annualDepreciation = cost / usefulLifeYears;
    return annualDepreciation * ageInYears;
  }

  /**
   * Declining-balance depreciation calculation
   */
  static calculateDecliningBalance(cost, depreciationRate, ageInYears) {
    if (depreciationRate <= 0) return 0;
    const rate = depreciationRate / 100;
    return cost * (1 - Math.pow(1 - rate, ageInYears));
  }

  /**
   * Get asset age in years (decimal)
   */
  static getAssetAge(purchaseDate) {
    const now = new Date();
    const purchase = new Date(purchaseDate);
    return (now - purchase) / (1000 * 60 * 60 * 24 * 365);
  }
}

/**
 * Asset Status Tracker
 * Manages asset status transitions and validations
 */
export class AssetStatusTracker {
  static VALID_STATUSES = [
    "Available",
    "Assigned",
    "Maintenance",
    "Retired",
    "Lost",
    "Damaged",
  ];

  static STATUS_TRANSITIONS = {
    Available: ["Assigned", "Maintenance", "Lost", "Damaged", "Retired"],
    Assigned: ["Available", "Maintenance", "Lost", "Damaged", "Retired"],
    Maintenance: ["Available", "Assigned", "Lost", "Damaged", "Retired"],
    Retired: [], // No transitions from Retired
    Lost: ["Found", "Retired"],
    Damaged: ["Maintenance", "Retired"],
  };

  /**
   * Validate status transition
   */
  static isValidTransition(currentStatus, newStatus) {
    if (!this.VALID_STATUSES.includes(newStatus)) {
      return false;
    }
    return this.STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status) {
    const colors = {
      Available: "green",
      Assigned: "blue",
      Maintenance: "orange",
      Retired: "gray",
      Lost: "red",
      Damaged: "red",
    };
    return colors[status] || "gray";
  }

  /**
   * Get status description
   */
  static getStatusDescription(status) {
    const descriptions = {
      Available: "Asset is available for assignment",
      Assigned: "Asset is currently assigned to an employee",
      Maintenance: "Asset is under repair or maintenance",
      Retired: "Asset has reached end of life",
      Lost: "Asset is missing",
      Damaged: "Asset requires repair",
    };
    return descriptions[status] || "Unknown status";
  }
}

/**
 * Warranty Tracker
 * Manages warranty-related information and alerts
 */
export class WarrantyTracker {
  /**
   * Get warranty status
   */
  static getWarrantyStatus(warrantyExpiryDate) {
    if (!warrantyExpiryDate) {
      return {
        status: "No Warranty",
        daysRemaining: null,
        alert: false,
      };
    }

    const now = new Date();
    const expiry = new Date(warrantyExpiryDate);
    const daysRemaining = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        status: "Expired",
        daysRemaining: 0,
        alert: true,
      };
    }

    if (daysRemaining <= 30) {
      return {
        status: "Expiring Soon",
        daysRemaining,
        alert: true,
      };
    }

    return {
      status: "Active",
      daysRemaining,
      alert: false,
    };
  }

  /**
   * Check if warranty is still active
   */
  static isActive(warrantyExpiryDate) {
    if (!warrantyExpiryDate) return false;
    return new Date(warrantyExpiryDate) > new Date();
  }
}

/**
 * Maintenance Scheduler
 * Manages maintenance schedules and alerts
 */
export class MaintenanceScheduler {
  /**
   * Calculate next maintenance due date
   */
  static calculateNextDueDate(lastMaintenanceDate, intervalInDays) {
    const nextDate = new Date(lastMaintenanceDate);
    nextDate.setDate(nextDate.getDate() + intervalInDays);
    return nextDate;
  }

  /**
   * Get maintenance status
   */
  static getMaintenanceStatus(nextMaintenanceDueDate) {
    if (!nextMaintenanceDueDate) {
      return {
        status: "No Maintenance Scheduled",
        daysUntilDue: null,
        alert: false,
      };
    }

    const now = new Date();
    const dueDate = new Date(nextMaintenanceDueDate);
    const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return {
        status: "Overdue",
        daysUntilDue: 0,
        alert: true,
      };
    }

    if (daysUntilDue <= 7) {
      return {
        status: "Due Soon",
        daysUntilDue,
        alert: true,
      };
    }

    return {
      status: "On Schedule",
      daysUntilDue,
      alert: false,
    };
  }

  /**
   * Check if maintenance is overdue
   */
  static isOverdue(nextMaintenanceDueDate) {
    if (!nextMaintenanceDueDate) return false;
    return new Date() > new Date(nextMaintenanceDueDate);
  }
}

/**
 * Asset Search & Filter Helper
 */
export class AssetSearchHelper {
  /**
   * Build MongoDB query from filters
   */
  static buildQuery(filters = {}) {
    const query = { isActive: true };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    if (filters.department) {
      query.department = filters.department;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { serialNumber: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
        { manufacturer: { $regex: filters.search, $options: "i" } },
      ];
    }

    return query;
  }

  /**
   * Get valid sort options
   */
  static getValidSortOptions() {
    return [
      "name",
      "-name",
      "createdAt",
      "-createdAt",
      "cost",
      "-cost",
      "bookValue",
      "-bookValue",
      "status",
      "type",
    ];
  }

  /**
   * Validate and sanitize sort parameter
   */
  static validateSort(sortParam) {
    const validOptions = this.getValidSortOptions();
    return validOptions.includes(sortParam) ? sortParam : "-createdAt";
  }
}

/**
 * Asset Audit Logger
 */
export class AssetAuditLogger {
  static logOperation(userId, operation, assetId, changes = {}) {
    logger.info(`Asset operation: ${operation}`, {
      userId,
      assetId,
      operation,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  static logAccess(userId, assetId, action = "viewed") {
    logger.info(`Asset access: ${action}`, {
      userId,
      assetId,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  static logError(userId, assetId, error, context = {}) {
    logger.error(`Asset error: ${error.message}`, {
      userId,
      assetId,
      error: error.message,
      ...context,
    });
  }
}

/**
 * Asset Validation Helper
 */
export class AssetValidator {
  /**
   * Validate asset cost
   */
  static validateCost(cost) {
    if (typeof cost !== "number" || cost < 0) {
      throw new ApiError(400, "Asset cost must be a non-negative number");
    }
    return true;
  }

  /**
   * Validate useful life
   */
  static validateUsefulLife(years) {
    if (typeof years !== "number" || years <= 0) {
      throw new ApiError(400, "Useful life must be a positive number");
    }
    return true;
  }

  /**
   * Validate depreciation rate
   */
  static validateDepreciationRate(rate) {
    if (typeof rate !== "number" || rate < 0 || rate > 100) {
      throw new ApiError(400, "Depreciation rate must be between 0 and 100");
    }
    return true;
  }

  /**
   * Validate serial number format
   */
  static validateSerialNumber(serialNumber) {
    const pattern = /^[A-Z0-9\-]{3,50}$/;
    if (serialNumber && !pattern.test(serialNumber)) {
      throw new ApiError(
        400,
        "Serial number must be 3-50 alphanumeric characters with dashes"
      );
    }
    return true;
  }

  /**
   * Validate ObjectId
   */
  static validateObjectId(id) {
    if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid ID format");
    }
    return true;
  }
}

// ===== EXPORT ALL UTILITIES =====

export default {
  ApiResponse,
  ApiError,
  asyncHandler,
  logger,
  DepreciationCalculator,
  AssetStatusTracker,
  WarrantyTracker,
  MaintenanceScheduler,
  AssetSearchHelper,
  AssetAuditLogger,
  AssetValidator,
};
