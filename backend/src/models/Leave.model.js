import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Leave type is required"],
      enum: {
        values: ["Sick", "Casual", "Paid", "Maternity"],
        message: "Leave type must be Sick, Casual, Paid, or Maternity",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["Applied", "Approved", "Rejected"],
        message: "Status must be Applied, Approved, or Rejected",
      },
      default: "Applied",
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          // 'this' refers to the document. If it is an update, checks should handle the context
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be on or after start date",
      },
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compounded index to prevent employee from applying duplicate leaves in overlapping ranges (though logic validation is done at controller level, indexing ranges is standard)
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });

export default mongoose.model("Leave", leaveSchema);