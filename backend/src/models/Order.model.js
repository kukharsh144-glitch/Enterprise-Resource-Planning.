import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required in order line"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price cannot be negative"],
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [
        {
          validator: function (val) {
            return val && val.length > 0;
          },
          message: "Order must contain at least one item",
        },
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
      default: 0,
    },
    isEmployeeOrder: {
      type: Boolean,
      default: false,
    },
    discountPercentApplied: {
      type: Number,
      default: 0,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "placed", "delivered", "cancelled"],
        message: "Status must be pending, placed, delivered, or cancelled",
      },
      lowercase: true,
      trim: true,
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function () {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );
  }
});

export default mongoose.model("Order", orderSchema);