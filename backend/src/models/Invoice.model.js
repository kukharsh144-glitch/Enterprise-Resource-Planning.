import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Invoice amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Paid", "Cancelled"],
        message: "Status must be Pending, Paid, or Cancelled",
      },
      trim: true,
      default: "Pending", // Fixed trailing space typo: "Pending " -> "Pending"
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Invoice", invoiceSchema);