import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Fullname is required"],
      trim: true,
      minlength: [3, "Fullname must be at least 3 characters"],
      maxlength: [50, "Fullname cannot exceed 50 characters"],
      index: true,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Security audit requirement
    },
    role: {
      type: String,
      enum: {
        values: [
          "Super Admin",
          "Admin",
          "Manager",
          "HR",
          "Accountant",
          "Employee",
        ],
        message: "Invalid role specified",
      },
      default: "Employee",
      required : true,
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

     employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
 
    // Department reference (optional, mainly for HR/Manager roles)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
 
    // Refresh token: stored hashed for security
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
 
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
 
    // Last login timestamp
    lastLogin: {
      type: Date,
      default: null,
    },
 
    // Password reset token and expiry (for forgot password flow)
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
 
    passwordResetExpiry: {
      type: Date,
      default: null,
      select: false,
    },
 
    // Two-factor authentication (optional for future)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
 
    twoFactorSecret: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * PRE-SAVE MIDDLEWARE: Hash password before storing
 * Only runs if password is new or modified
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * METHOD: Compare plaintext password with hashed password
 * Used during login
 */
userSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password) {
    throw new Error("Password field must be selected to compare");
  }
  return await bcrypt.compare(password, this.password);
};

/**
 * METHOD: Generate JWT access token
 * Payload: user._id, email, role
 * Expiry: 15 minutes (short-lived)
 */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    }
  );
};

/**
 * METHOD: Generate JWT refresh token
 * Payload: user._id
 * Expiry: 7 days (long-lived, must be rotated)
 * Stored in DB for validation
 */
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY|| "7d",
    }
  );
};

/**
 * METHOD: Check if user has permission for a specific module & action
 * Usage: user.hasPermission("projects", "create")
 */
userSchema.methods.hasPermission = function (module, action) {
  const permissions = {
    users: {
      create: ["Super Admin", "Admin"],
      read: ["Super Admin", "Admin", "Manager", "HR"],
      update: ["Super Admin", "Admin"],
      delete: ["Super Admin"],
    },
    employees: {
      create: ["Super Admin", "Admin", "HR"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
      update: ["Super Admin", "Admin", "HR"],
      delete: ["Super Admin"],
    },
    projects: {
      create: ["Super Admin", "Admin", "Manager", "HR"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant", "Employee"],
      update: ["Super Admin", "Admin", "Manager"],
      delete: ["Super Admin"],
      assignTask: ["Super Admin", "Admin", "Manager"],
    },
    payroll: {
      create: ["Super Admin", "Admin", "HR", "Accountant"],
      read: ["Super Admin", "Admin", "HR", "Accountant"],
      update: ["Super Admin", "Admin", "Accountant"],
      delete: ["Super Admin"],
    },
    inventory: {
      create: ["Super Admin", "Admin", "Manager"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
      update: ["Super Admin", "Admin", "Manager"],
      delete: ["Super Admin"],
    },
  };
 
  const allowedRoles = permissions[module]?.[action] || [];
  return allowedRoles.includes(this.role);
};

/**
 * METHOD: Get public user data (safe to send to client)
 */
userSchema.methods.getPublicData = function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    department: this.department,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    avatar: this.avatar,
    documents: this.documents,
    address: this.address,
    avatarScale: this.avatarScale,
    avatarPositionX: this.avatarPositionX,
    avatarPositionY: this.avatarPositionY,
    createdAt: this.createdAt,
  };
};

/**
 * INDEX: Optimize queries on frequently searched fields
 */
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export default mongoose.model("User", userSchema);