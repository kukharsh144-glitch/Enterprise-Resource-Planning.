import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    roleInProject: {
      type: String,
      enum: {
        values: ["Manager", "Member"],
        message: "Role in project must be Manager or Member",
      },
      default: "Member",
      required : [true,"Role in project is required"]
    },
    allocationPercent: {
      type: Number,
      required: [true, "Allocation percentage is required"],
      min: [0, "Allocation percent cannot be less than 0"],
      max: [100, "Allocation percent cannot exceed 100"],
      default: 50,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique employee per project
projectMemberSchema.index(
  {
    project: 1,
    employee: 1,
  },
  {
    unique: true,
  }
);

// For quick lookups
projectMemberSchema.index({ project: 1, roleInProject: 1 });

export default mongoose.model("ProjectMember", projectMemberSchema);