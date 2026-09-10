import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee must be linked to a User account"],
      unique: true, // One-to-One mapping between User and Employee profile
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Employee must be assigned to a department"],
      index: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      minlength: [2, "Designation must be at least 2 characters"],
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, "Experience cannot be negative"],
    },
    salaryBand: {
      type: String,
      required: [true, "Salary band is required"],
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    weeklyCapacityHours: {
      type: Number,
      default: 40,
      min: [1, "Weekly capacity hours must be at least 1"],
      max: [168, "Weekly capacity hours cannot exceed 168"],
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "On Leave", "Terminated"],
        message: "Invalid employee status specified",
      },
      default: "Active",
      index: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    documents: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
      }
    ],
    address: {
      type: String,
      default: "",
    },
    avatarScale: {
      type: Number,
      default: 1,
    },
    avatarPositionX: {
      type: Number,
      default: 50,
    },
    avatarPositionY: {
      type: Number,
      default: 50,
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    // New registration fields
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    alternatePhone: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },
    maritalStatus: {
      type: String,
      required: [true, "Marital status is required"],
      enum: ["Single", "Married", "Divorced", "Widowed"],
    },
    nationality: {
      type: String,
      default: "",
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    religion: {
      type: String,
      default: "",
    },
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      enum: ["Full-Time", "Part-Time", "Contract", "Intern"],
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    workLocation: {
      type: String,
      required: [true, "Work location is required"],
    },
    probationPeriod: {
      type: Number,
      default: 0,
    },
    noticePeriod: {
      type: Number,
      default: 0,
    },
    workingHoursPerDay: {
      type: Number,
      default: 8,
    },
    payrollGroup: {
      type: String,
      default: "",
    },
    currentAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    permanentAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    sameAsCurrentAddress: {
      type: Boolean,
      default: false,
    },
    educationQualification: {
      type: String,
      default: "",
    },
    previousCompany: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Employee", employeeSchema);