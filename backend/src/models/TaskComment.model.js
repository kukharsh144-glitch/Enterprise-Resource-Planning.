import mongoose from "mongoose";

const taskCommentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Author reference is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Comment message is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index to retrieve task comments in chronological order (newest first)
taskCommentSchema.index({ task: 1, createdAt: -1 });

export default mongoose.model("TaskComment", taskCommentSchema);