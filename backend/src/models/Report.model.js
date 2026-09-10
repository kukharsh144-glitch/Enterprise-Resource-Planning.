import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Report type is required"],
      trim: true,
      index: true,
    },
    data: {
      type: String, // Stored as a serialized JSON string or cached aggregated payload
      required: [true, "Report data payload is required"],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Generator user reference is required"],
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search optimization on type and creation date
reportSchema.index({ type: 1, generatedAt: -1 });

export default mongoose.model("Report", reportSchema);