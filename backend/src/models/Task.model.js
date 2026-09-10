import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task must belong to a project"],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [3, "Task title must be at least 2 characters"],
      maxlength: [150, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Task description cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "In Progress", "Completed", "Blocked"],
        message: "Invalid task status",
      },
      default: "Pending",
      index: true,
    },
    progressPercent: {
      type: Number,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
      default: 0,
    },
    weight: {
      type: Number,
      min: [0.5, "Weight must be at least 0.5"],
      max: [10, "Weight cannot exceed 10"],
      default: 1,
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Critical"],
        message: "Invalid Priority",
      },
      default: "Medium",
      index: true,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: [1, "Estimated hours must be at least 1"],
      max: [500, "Estimated hours seems too high"],
    },
    actualHours: {
      type: Number,
      default: 0,
      min: [0, "Actual hours cannot be negative"],
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          // If startDate is set, dueDate must be >= startDate
          return !this.startDate || !value || value >= this.startDate;
        },
        message: "Due date must be on or after task start date",
      },
      index: true,
    },
    blockedReason: {
      type: String,
      trim: true,
      default: "",
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    tags: [String], // For filtering/categorization
    phase: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize compound searches for task lists
// Indexes for query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

// Automatically adjust progressPercent when task is completed or blocked reason is updated
taskSchema.pre("save", function () {
  if (this.status === "Completed") {
    this.progressPercent = 100;
  }
  
  if (this.status !== "Blocked") {
    this.blockedReason = ""; // Clear block reasons if status changes to non-blocked
  } else if (this.status === "Blocked" && !this.blockedReason) {
    this.blockedReason = "No reason specified";
  }
});

export default mongoose.model("Task", taskSchema);