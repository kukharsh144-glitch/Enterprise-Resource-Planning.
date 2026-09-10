import mongoose from "mongoose";

const projectMessageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId, // Fixed typo: mongoose.schem.Types.ObjectId -> mongoose.Schema.Types.ObjectId
      ref: "Employee",
      required: [true, "Sender reference is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message content is required"], // Fixed typo: requiired -> required
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee", // Fixed broken ref: "" -> "Employee" and changed to array of ObjectIds
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index to retrieve chat history chronologically (newest first or oldest first)
projectMessageSchema.index({ project: 1, createdAt: -1 });

export default mongoose.model("ProjectMessage", projectMessageSchema);