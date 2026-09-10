import mongoose from "mongoose";

/**
 * Payroll Collection
 * From ERP PDF Section 5: "Net Salary = Base Salary + Bonus − Tax − Provident Fund − Other Deductions"
 * Pay cycle (YYYY-MM) is the unique key per employee
 * Supports approval workflow: Draft → Approved → Processed
 */
const payrollSchema = new mongoose.Schema(
  {
    // Reference to Employee
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    // Pay cycle in YYYY-MM format
    payCycle: {
      type: String,
      required: [true, "Pay cycle (YYYY-MM) is required"],
      match: [/^\d{4}-\d{2}$/, "Pay cycle must be in YYYY-MM format"],
      index: true,
    },

    // Salary Components
    baseSalary: {
      type: Number,
      required: [true, "Base salary is required"],
      min: [0, "Base salary cannot be negative"],
    },

    bonus: {
      type: Number,
      default: 0,
      min: [0, "Bonus cannot be negative"],
    },

    // Deductions
    tax: {
      type: Number,
      required: [true, "Tax is required"],
      min: [0, "Tax cannot be negative"],
    },

    providentFund: {
      type: Number,
      required: [true, "Provident Fund is required"],
      min: [0, "Provident Fund cannot be negative"],
    },

    // Leave deduction (from Leave Management module)
    // If employee took unpaid leave, salary is reduced
    leaveDeduction: {
      type: Number,
      default: 0,
      min: [0, "Leave deduction cannot be negative"],
    },

    // Other custom deductions (insurance, loans, etc.)
    otherDeductions: {
      type: Number,
      default: 0,
      min: [0, "Other deductions cannot be negative"],
    },

    // Additional components (DA, HRA, etc.)
    dearestAllowance: {
      type: Number,
      default: 0,
    },

    houseRentAllowance: {
      type: Number,
      default: 0,
    },

    medicalAllowance: {
      type: Number,
      default: 0,
    },

    // COMPUTED: Net Salary = Base + Bonus + DA + HRA + MA - Tax - PF - Leave Deduction - Other Deductions
    netSalary: {
      type: Number,
      default: 0,
      min: [0, "Net salary cannot be negative"],
    },

    // Approval Workflow
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Approved", "Rejected", "Processed", "Paid"],
      default: "Draft",
      index: true,
    },

    // Person who approved (HR/Accountant)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvalDate: {
      type: Date,
      default: null,
    },

    approvalNotes: {
      type: String,
      default: null,
    },

    // Rejection details
    rejectionReason: {
      type: String,
      default: null,
    },

    rejectionDate: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Accounting Ledger Integration
    ledgerEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerEntry",
      default: null,
    },

    // Payment tracking
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Check", "Cash", "Digital Wallet"],
      default: "Bank Transfer",
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
    },

    // Notes/Comments
    remarks: {
      type: String,
      default: null,
      maxlength: 500,
    },

    // Meta information
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound Unique Index: one payroll record per employee per pay cycle
 */
payrollSchema.index({ employee: 1, payCycle: 1 }, { unique: true });
payrollSchema.index({ payCycle: 1, status: 1 });
payrollSchema.index({ employee: 1, status: 1 });
payrollSchema.index({ createdAt: -1 });

/**
 * PRE-SAVE MIDDLEWARE: Calculate net salary before storing
 * Called before every save/update
 */
payrollSchema.pre("save", function (next) {
  try {
    // Formula: Base + Bonus + Allowances - Deductions
    const grossSalary =
      this.baseSalary +
      this.bonus +
      (this.dearestAllowance || 0) +
      (this.houseRentAllowance || 0) +
      (this.medicalAllowance || 0);

    const totalDeductions =
      (this.tax || 0) +
      (this.providentFund || 0) +
      (this.leaveDeduction || 0) +
      (this.otherDeductions || 0);

    this.netSalary = Math.max(0, grossSalary - totalDeductions);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * METHOD: Get salary breakdown for display
 */
payrollSchema.methods.getSalaryBreakdown = function () {
  return {
    earnings: {
      base: this.baseSalary,
      bonus: this.bonus,
      da: this.dearestAllowance || 0,
      hra: this.houseRentAllowance || 0,
      medical: this.medicalAllowance || 0,
      total:
        this.baseSalary +
        this.bonus +
        (this.dearestAllowance || 0) +
        (this.houseRentAllowance || 0) +
        (this.medicalAllowance || 0),
    },
    deductions: {
      tax: this.tax,
      pf: this.providentFund,
      leaveDeduction: this.leaveDeduction || 0,
      other: this.otherDeductions || 0,
      total:
        this.tax +
        this.providentFund +
        (this.leaveDeduction || 0) +
        (this.otherDeductions || 0),
    },
    net: this.netSalary,
  };
};

/**
 * METHOD: Mark payroll as approved
 */
payrollSchema.methods.approve = function (approvalBy, notes = null) {
  this.status = "Approved";
  this.approvedBy = approvalBy;
  this.approvalDate = new Date();
  this.approvalNotes = notes;
  return this;
};

/**
 * METHOD: Mark payroll as rejected
 */
payrollSchema.methods.reject = function (rejectedBy, reason) {
  this.status = "Rejected";
  this.rejectedBy = rejectedBy;
  this.rejectionReason = reason;
  this.rejectionDate = new Date();
  return this;
};

/**
 * METHOD: Mark payroll as processed (salary calculated and ready for payment)
 */
payrollSchema.methods.markProcessed = function (processedBy) {
  this.status = "Processed";
  this.processedBy = processedBy;
  this.processedDate = new Date();
  return this;
};

/**
 * METHOD: Mark payroll as paid
 */
payrollSchema.methods.markPaid = function (paymentDate, transactionId, method = "Bank Transfer") {
  this.status = "Paid";
  this.paymentDate = paymentDate;
  this.transactionId = transactionId;
  this.paymentMethod = method;
  return this;
};

/**
 * STATIC: Get all pending payrolls for a given pay cycle
 */
payrollSchema.statics.getPendingForCycle = async function (payCycle) {
  return await this.find({
    payCycle,
    status: { $in: ["Draft", "Submitted"] },
  })
    .populate("employee", "name salaryBand")
    .sort({ createdAt: 1 });
};

/**
 * STATIC: Get all approved payrolls awaiting processing
 */
payrollSchema.statics.getApprovedForProcessing = async function (payCycle = null) {
  const query = { status: "Approved" };
  if (payCycle) query.payCycle = payCycle;

  return await this.find(query)
    .populate("employee", "name")
    .populate("approvedBy", "username")
    .sort({ payCycle: -1 });
};

/**
 * STATIC: Get payroll statistics for a pay cycle
 */
payrollSchema.statics.getCycleStatistics = async function (payCycle) {
  const stats = await this.aggregate([
    { $match: { payCycle } },
    {
      $group: {
        _id: "$payCycle",
        totalEmployees: { $sum: 1 },
        totalGross: { $sum: "$baseSalary" },
        totalBonus: { $sum: "$bonus" },
        totalDeductions: {
          $sum: {
            $add: ["$tax", "$providentFund", "$leaveDeduction", "$otherDeductions"],
          },
        },
        totalNet: { $sum: "$netSalary" },
        approved: {
          $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
        },
        pending: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["Draft", "Submitted"]],
              },
              1,
              0,
            ],
          },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || null;
};

export default mongoose.model("Payroll", payrollSchema);