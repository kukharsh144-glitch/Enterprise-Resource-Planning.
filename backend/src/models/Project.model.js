import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [3, "Project name must be at least 3 characters"],
      maxlength: [150, "Project name cannot exceed 150 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "Deadline must be on or after project start date",
      },
      index: true,
    },
    expectedProgress: {
      type: Number,
      default: 0,
      min: [0, "Expected progress cannot be negative"],
      max: [100, "Expected progress cannot exceed 100"],
    },
    actualProgress: {
      type: Number,
      default: 0,
      min: [0, "Actual progress cannot be negative"],
      max: [100, "Actual progress cannot exceed 100"],
    },
    estimatedCompletionDate: {
      type: Date,
      default: null,
    },
    healthStatus: {
      type: String,
      enum: {
        values: ["On-Track", "At-Risk", "Likely to Miss Deadline"],
        message: "Invalid health status specified",
      },
      default: "On-Track",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Completed", "On-Hold"],
        message: "Invalid project status specified",
      },
      default: "Active",
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Critical"],
        message: "Priority must be Low, Medium, High, or Critical",
      },
      default: "Medium",
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Project manager is required"],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    creatorName: {
      type: String,
      trim: true,
      default: "",
    },
    creatorRole: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    architecture: {
      type: String,
      trim: true,
      default: "",
    },
    targetCloud: {
      type: String,
      trim: true,
      default: "",
    },
    aiEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize multi-key query indexing for project dashboards
projectSchema.index({ status: 1, deadline: 1 });
projectSchema.index({ manager: 1, status: 1 });

export default mongoose.model("Project", projectSchema);