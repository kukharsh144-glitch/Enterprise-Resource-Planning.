import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    warehouse: {
      type: String,
      required: [true, "Warehouse name is required"],
      trim: true,
      index: true,
    },
    quantityInStock: {
      type: Number,
      required: [true, "Quantity in stock is required"],
      min: [0, "Quantity in stock cannot be negative"],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: [true, "Reorder level is required"],
      min: [0, "Reorder level cannot be negative"],
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single inventory record per product per warehouse
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

export default mongoose.model("Inventory", inventorySchema);