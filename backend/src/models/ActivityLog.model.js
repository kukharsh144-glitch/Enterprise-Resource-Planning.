import mongoose from "mongoose";

/**
 * ActivityLog Collection
 * Audit trail for all important system actions
 * From PDF: "every create/update/delete is logged"
 * Used for: security audit, compliance, troubleshooting, project activity feed
 */
const activityLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // What action was performed
    action: {
      type: String,
      enum: [
        // Auth actions
        "login",
        "logout",
        "create_user",
        "update_user_role",
        "update_profile",
        "password_reset",
        
        // Employee actions
        "create_employee",
        "update_employee",
        "delete_employee",
        
        // Leave actions
        "apply_leave",
        "approve_leave",
        "reject_leave",
        "cancel_leave",
        
        // Payroll actions
        "create_payroll",
        "update_payroll",
        "approve_payroll",
        "process_payroll",
        
        // Project actions
        "create_project",
        "update_project",
        "delete_project",
        "assign_project_member",
        "remove_project_member",
        
        // Task actions
        "create_task",
        "update_task",
        "delete_task",
        "change_task_status",
        "update_task_progress",
        "add_task_comment",
        "block_task",
        "unblock_task",
        
        // Project collaboration
        "post_project_message",
        "mention_user",
        "update_project_settings",
        
        // Inventory actions
        "add_inventory",
        "update_inventory",
        "remove_inventory",
        
        // Purchase actions
        "create_po",
        "approve_po",
        "reject_po",
        "receive_goods",
        
        // Sales actions
        "create_sales_order",
        "confirm_sales_order",
        "cancel_sales_order",
        "create_invoice",
        
        // CRM actions
        "create_lead",
        "update_lead",
        "convert_lead",
        
        // Accounting actions
        "record_expense",
        "generate_report",
        "reconcile_account",
        
        // System actions
        "system_update",
        "configuration_change",
      ],
      required: true,
      index: true,
    },

    // What entity was affected
    entityType: {
      type: String,
      enum: [
        "User",
        "Employee",
        "Leave",
        "Payroll",
        "Project",
        "Task",
        "ProjectMember",
        "TaskComment",
        "ProjectMessage",
        "ProjectActivity",
        "Inventory",
        "Product",
        "PurchaseOrder",
        "SalesOrder",
        "Invoice",
        "Lead",
        "Expense",
        "Account",
        "System",
      ],
      required: true,
      index: true,
    },

    // ID of the entity that was modified
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Additional context about the change
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      // Example:
      // {
      //   oldRole: "Employee",
      //   newRole: "Manager",
      //   reason: "Promotion"
      // }
      // or
      // {
      //   status: "Completed",
      //   progressPercent: 100
      // }
    },

    // Status of the action
    status: {
      type: String,
      enum: ["success", "failure", "warning"],
      default: "success",
    },

    // Error message if action failed
    errorMessage: {
      type: String,
      default: null,
    },

    // IP address of the requester
    ipAddress: {
      type: String,
      default: null,
    },

    // User agent / browser info
    userAgent: {
      type: String,
      default: null,
    },

    // Timestamp of the action
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use 'timestamp' for the action time
    collection: "project_activity", // For project-specific activity feed
  }
);

// Compound indexes for common queries
activityLogSchema.index({ actor: 1, timestamp: -1 });
activityLogSchema.index({ entityId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 }); // For recent activity queries

/**
 * METHOD: Get formatted activity description for UI
 */
activityLogSchema.methods.getDescription = function () {
  const descriptions = {
    login: `User logged in`,
    logout: `User logged out`,
    create_user: `Created new user`,
    update_user_role: `Updated user role to ${this.details?.newRole}`,
    update_profile: `Updated user profile`,
    create_project: `Created project`,
    update_project: `Updated project`,
    create_task: `Created task: ${this.details?.taskTitle || ""}`,
    update_task: `Updated task`,
    change_task_status: `Changed task status to ${this.details?.newStatus}`,
    update_task_progress: `Updated task progress to ${this.details?.progressPercent}%`,
    add_task_comment: `Added comment on task`,
    block_task: `Blocked task: ${this.details?.reason || "No reason provided"}`,
    unblock_task: `Unblocked task`,
    post_project_message: `Posted message in project chat`,
    apply_leave: `Applied for ${this.details?.leaveType} leave`,
    approve_leave: `Approved leave request`,
    reject_leave: `Rejected leave request`,
  };

  return descriptions[this.action] || this.action;
};

/**
 * STATIC: Create activity log entry
 * Usage: ActivityLog.logActivity({ actor, action, entityType, entityId, ... })
 */
activityLogSchema.statics.logActivity = async function (logData) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error("Failed to create activity log:", error);
    // Don't throw — logging failures shouldn't break main operations
  }
};

/**
 * STATIC: Get activity feed for an entity
 * Usage: ActivityLog.getEntityActivity("project_id", limit: 50)
 */
activityLogSchema.statics.getEntityActivity = async function (
  entityId,
  limit = 50
) {
  return await this.find({ entityId })
    .populate("actor", "username email")
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * STATIC: Get recent activities by user
 * Usage: ActivityLog.getUserActivity("user_id", days: 7)
 */
activityLogSchema.statics.getUserActivity = async function (userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return await this.find({
    actor: userId,
    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .limit(100);
};

/**
 * STATIC: Generate audit report
 * Usage: ActivityLog.generateAuditReport({ startDate, endDate, action, entityType })
 */
activityLogSchema.statics.generateAuditReport = async function (filters) {
  const query = {};

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.entityType) {
    query.entityType = filters.entityType;
  }

  if (filters.actor) {
    query.actor = filters.actor;
  }

  return await this.find(query)
    .populate("actor", "username email role")
    .sort({ timestamp: -1 });
};

export default mongoose.model("ActivityLog", activityLogSchema);