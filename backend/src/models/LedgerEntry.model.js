import mongoose from "mongoose";

/**
 * LedgerEntry Collection (Accounting Module)
 * Records all financial transactions (expenses, income, payroll, etc.)
 * Integrates with Payroll module: when payroll is processed, entries are created automatically
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    // Transaction date
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Description of the transaction
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Debit account (account being charged)
    debitAccount: {
      type: String,
      required: true,
      index: true,
      // Examples: "Salary Expense", "Office Supplies", "Rent Expense"
    },

    // Debit amount (money going out)
    debitAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Credit account (account being credited)
    creditAccount: {
      type: String,
      required: true,
      index: true,
      // Examples: "Bank", "Payables", "Revenue"
    },

    // Credit amount (money coming in)
    creditAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Must balance: debit === credit
    // Enforced by pre-save middleware

    // Reference to related entity (Payroll, Expense, Invoice, etc.)
    reference: {
      type: String,
      default: null,
      index: true,
    },

    // Type of transaction
    type: {
      type: String,
      enum: ["Expense", "Income", "Transfer", "Adjustment"],
      default: "Expense",
      index: true,
    },

    // User who created this entry
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notes
    notes: {
      type: String,
      default: null,
    },

    // Is this entry approved/finalized?
    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvalDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * PRE-SAVE: Ensure debit === credit (double entry accounting)
 */
ledgerEntrySchema.pre("save", function (next) {
  if (this.debitAmount !== this.creditAmount) {
    return next(
      new Error(
        "Double entry accounting error: debitAmount must equal creditAmount"
      )
    );
  }
  next();
});

/**
 * INDEX: Common queries
 */
ledgerEntrySchema.index({ date: -1 });
ledgerEntrySchema.index({ debitAccount: 1, date: -1 });
ledgerEntrySchema.index({ creditAccount: 1, date: -1 });
ledgerEntrySchema.index({ type: 1, date: -1 });

/**
 * STATIC: Get account balance between dates
 */
ledgerEntrySchema.statics.getAccountBalance = async function (
  account,
  startDate,
  endDate
) {
  const entries = await this.find({
    $or: [
      { debitAccount: account, date: { $gte: startDate, $lte: endDate } },
      { creditAccount: account, date: { $gte: startDate, $lte: endDate } },
    ],
  });

  let balance = 0;
  entries.forEach((entry) => {
    if (entry.debitAccount === account) {
      balance += entry.debitAmount;
    }
    if (entry.creditAccount === account) {
      balance -= entry.creditAmount;
    }
  });

  return balance;
};

export default mongoose.model("LedgerEntry", ledgerEntrySchema);