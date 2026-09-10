import mongoose from "mongoose";

const projectActivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Actor reference is required"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action description is required"],
      trim: true,
      maxlength: [500, "Action description cannot exceed 500 characters"],
    },
    entityType: {
      type: String,
      required: [true, "Entity type is required"],
      enum: {
        values: ["Task", "Project", "Comment", "Message", "Member"],
        message: "Invalid entity type",
      },
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Affected record entityId is required"],
    },
     timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,// Only use timestamp, not createdAt/updatedAt
  }
);

// Index to retrieve project activities in chronological order
projectActivitySchema.index({ project: 1, createdAt: -1 });

export default mongoose.model("ProjectActivity", projectActivitySchema);
