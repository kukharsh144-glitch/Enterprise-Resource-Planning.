import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      lowercase: true,
      trim: true,
      minlength: [2, "Supplier name must be at least 2 characters"],
      maxlength: [100, "Supplier name cannot exceed 100 characters"],
      index: true,
    },
    contactPerson: {
      type: String,
      required: [true, "Contact person name is required"],
      trim: true,
      minlength: [2, "Contact person name must be at least 2 characters"],
      maxlength: [100, "Contact person name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Supplier email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Supplier phone number is required"],
      trim: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        "Please fill a valid phone number (E.164 format, e.g., +1234567890)",
      ],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Supplier", supplierSchema);