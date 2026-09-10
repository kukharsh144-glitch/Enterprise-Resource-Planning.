import mongoose from "mongoose";

/**
 * Asset Management Schema
 * Tracks company-owned physical assets, their assignment to employees,
 * lifecycle/maintenance status, depreciation, and warranty details
 * 
 * Roles with access:
 * - Super Admin: full CRUD
 * - Admin: full CRUD
 * - Manager: read-only, can assign assets to team members
 * - HR: read-only, resource allocation view
 * - Employee: read-only access to assigned assets
 */

const assetSchema = new mongoose.Schema(
  {
    // ===== Core Asset Information =====
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
      maxlength: [100, "Asset name cannot exceed 100 characters"],
      index: true,
    },

    type: {
      type: String,
      required: [true, "Asset type is required"],
      enum: {
        values: [
          "Computer",
          "Laptop",
          "Printer",
          "Scanner",
          "Monitor",
          "Furniture",
          "Vehicle",
          "Equipment",
          "Software License",
          "Other",
        ],
        message: "Asset type must be a valid asset category",
      },
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return !v || /^[A-Z0-9\-]{3,50}$/.test(v);
        },
        message: "Serial number must be alphanumeric with dashes (3-50 chars)",
      },
    },

    modelNumber: {
      type: String,
      trim: true,
      maxlength: [50, "Model number cannot exceed 50 characters"],
    },

    manufacturer: {
      type: String,
      trim: true,
      maxlength: [100, "Manufacturer name cannot exceed 100 characters"],
    },

    // ===== Assignment & Status =====
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    assignedDate: {
      type: Date,
      default: null,
    },

    assignmentNote: {
      type: String,
      trim: true,
      maxlength: [200, "Assignment note cannot exceed 200 characters"],
    },

    status: {
      type: String,
      enum: {
        values: ["Available", "Assigned", "Maintenance", "Retired", "Lost", "Damaged"],
        message:
          "Status must be one of: Available, Assigned, Maintenance, Retired, Lost, Damaged",
      },
      default: "Available",
      index: true,
    },

    statusChangedAt: {
      type: Date,
      default: Date.now,
    },

    // ===== Financial Information =====
    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
      index: true,
    },

    cost: {
      type: Number,
      min: [0, "Asset cost cannot be negative"],
      required: [true, "Asset cost is required"],
      default: 0,
    },

    // ===== Depreciation Tracking (for Finance module) =====
    depreciationType: {
      type: String,
      enum: ["Straight-Line", "Declining-Balance", "Units-of-Production", "None"],
      default: "Straight-Line",
    },

    depreciationRate: {
      type: Number,
      min: [0, "Depreciation rate cannot be negative"],
      max: [100, "Depreciation rate cannot exceed 100"],
      default: 0,
    },

    usefulLifeYears: {
      type: Number,
      min: [0, "Useful life must be positive"],
      default: 5,
    },

    accumulatedDepreciation: {
      type: Number,
      default: 0,
      min: [0, "Accumulated depreciation cannot be negative"],
    },

    bookValue: {
      type: Number,
      default: function () {
        return this.cost - this.accumulatedDepreciation;
      },
    },

    // ===== Warranty & Maintenance =====
    warrantyExpiryDate: {
      type: Date,
      default: null,
    },

    lastMaintenanceDate: {
      type: Date,
      default: null,
    },

    nextMaintenanceDueDate: {
      type: Date,
      default: null,
    },

    maintenanceInterval: {
      type: Number,
      default: 90, // days
      min: [1, "Maintenance interval must be at least 1 day"],
    },

    maintenanceHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        description: {
          type: String,
          required: true,
          maxlength: [300, "Maintenance description too long"],
        },
        cost: {
          type: Number,
          min: [0, "Maintenance cost cannot be negative"],
          default: 0,
        },
        performedBy: {
          type: String,
          trim: true,
          maxlength: [100, "Performed by name too long"],
        },
      },
    ],

    // ===== Location & Organization =====
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "Main Office",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    // ===== Metadata & Tracking =====
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    disposalDate: {
      type: Date,
      default: null,
    },

    disposalValue: {
      type: Number,
      min: [0, "Disposal value cannot be negative"],
      default: 0,
    },

    disposalNote: {
      type: String,
      trim: true,
      maxlength: [300, "Disposal note too long"],
    },

    attachments: [
      {
        documentType: {
          type: String,
          enum: ["Receipt", "Warranty", "License", "Manual", "Other"],
          default: "Other",
        },
        url: String,
        uploadedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // ===== Audit Trail =====
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===== Indexes =====
assetSchema.index({ assignedTo: 1, status: 1 });
assetSchema.index({ department: 1, status: 1 });
assetSchema.index({ type: 1, isActive: 1 });
assetSchema.index({ createdAt: -1 });
assetSchema.index({ warrantyExpiryDate: 1 });
assetSchema.index({ nextMaintenanceDueDate: 1 });

// ===== Virtual Properties =====

// Warranty status
assetSchema.virtual("warrantyStatus").get(function () {
  if (!this.warrantyExpiryDate) return "No Warranty";
  const daysUntilExpiry = Math.floor(
    (this.warrantyExpiryDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilExpiry < 0) return "Expired";
  if (daysUntilExpiry <= 30) return "Expiring Soon";
  return "Active";
});

// Maintenance status
assetSchema.virtual("maintenanceStatus").get(function () {
  if (!this.nextMaintenanceDueDate) return "No Maintenance Scheduled";
  const daysUntilDue = Math.floor(
    (this.nextMaintenanceDueDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilDue < 0) return "Overdue";
  if (daysUntilDue <= 7) return "Due Soon";
  return "On Schedule";
});

// Asset age in years
assetSchema.virtual("ageInYears").get(function () {
  return ((new Date() - this.purchaseDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(2);
});

// Depreciation percentage
assetSchema.virtual("deprecationPercentage").get(function () {
  if (this.cost === 0) return 0;
  return ((this.accumulatedDepreciation / this.cost) * 100).toFixed(2);
});

// ===== Middleware =====

// Update bookValue before saving
assetSchema.pre("save", function (next) {
  this.bookValue = Math.max(0, this.cost - this.accumulatedDepreciation);
  this.statusChangedAt = this.statusChangedAt || new Date();
  next();
});

// Populate references on find
assetSchema.pre(/^find/, function () {
  this.populate({
    path: "assignedTo",
    select: "firstName lastName email department",
  }).populate({
    path: "department",
    select: "name",
  });
});

export default mongoose.model("Asset", assetSchema);