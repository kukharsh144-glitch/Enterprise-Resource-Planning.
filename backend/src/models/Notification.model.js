import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification user is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Notification message cannot exceed 500 characters"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: ["Task", "Project", "Chat", "Mention", "System"],
        message: "Notification type must be Task, Project, Chat, Mention, or System",
      }, // Fixed spelling typo: enumm -> enum and added valid options
      index: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to optimize fetching unread notifications in reverse chronological order
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);