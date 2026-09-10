import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [100, "Customer name cannot exceed 100 characters"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Customer email is required"],
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
      required: [true, "Customer phone number is required"],
      unique: true,
      trim: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        "Please fill a valid phone number (E.164 format, e.g., +1234567890)",
      ],
      index: true,
    },
    address: {
      type: String,
      required: [true, "Customer address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Customer", customerSchema);