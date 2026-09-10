import Payroll from "../models/Payroll.model.js";
import Employee from "../models/Employee.model.js";
import LedgerEntry from "../models/LedgerEntry.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

/**
 * Get Payroll History with Filters & Pagination
 * Accessible by: HR, Accountant, Admin, Super Admin
 * Can filter by employee, status, pay cycle, and date range
 */
export const getPayrollHistory = async (req, res, next) => {
  try {
    // RBAC: Only finance roles can view payroll
    if (!["Super Admin", "Admin", "HR", "Accountant"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only HR and Accountant can view payroll")
      );
    }

    const { employeeId, status, payCycle, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (employeeId) {
      // Validate employee exists
      const empExists = await Employee.findById(employeeId);
      if (!empExists) {
        return res.status(404).json(
          new apiError(404, "Employee not found")
        );
      }
      filter.employee = employeeId;
    }

    if (status) {
      const validStatus = ["Draft", "Submitted", "Approved", "Rejected", "Processed", "Paid"];
      if (!validStatus.includes(status)) {
        return res.status(400).json(
          new apiError(400, `Invalid status. Valid values: ${validStatus.join(", ")}`)
        );
      }
      filter.status = status;
    }

    if (payCycle) {
      if (!/^\d{4}-\d{2}$/.test(payCycle)) {
        return res.status(400).json(
          new apiError(400, "Pay cycle must be in YYYY-MM format")
        );
      }
      filter.payCycle = payCycle;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json(
            new apiError(400, "Invalid start date format")
          );
        }
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json(
            new apiError(400, "Invalid end date format")
          );
        }
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch payroll records
    const payrolls = await Payroll.find(filter)
      .populate({
        path: "employee",
        select: "name designation department",
      })
      .populate("approvedBy", "username email")
      .populate("processedBy", "username email")
      .sort({ payCycle: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Payroll.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    return res.status(200).json(
      new apiResponse(
        200,
        {
          payrolls,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages,
          },
        },
        "Payroll history fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Payroll Record
 */
export const getPayrollById = async (req, res, next) => {
  try {
    const { payrollId } = req.params;

    if (!payrollId) {
      return res.status(400).json(
        new apiError(400, "Payroll ID is required")
      );
    }

    const payroll = await Payroll.findById(payrollId)
      .populate({
        path: "employee",
        select: "name designation department salaryBand",
      })
      .populate("approvedBy", "username email role")
      .populate("processedBy", "username email role");

    if (!payroll) {
      return res.status(404).json(
        new apiError(404, "Payroll record not found")
      );
    }

    // Return with breakdown
    const breakdown = payroll.getSalaryBreakdown();

    return res.status(200).json(
      new apiResponse(
        200,
        { ...payroll.toObject(), breakdown },
        "Payroll fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Run Payroll for All Active Employees (HR/Accountant Only)
 * Creates or updates payroll records for a given pay cycle
 * Status: Draft (awaiting HR review & data entry)
 */
export const runPayroll = async (req, res, next) => {
  try {
    // RBAC: Only HR and Accountant can run payroll
    if (!["Super Admin", "Admin", "HR"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only HR can run payroll")
      );
    }

    const { payCycle } = req.body;

    // Validation
    if (!payCycle) {
      return res.status(400).json(
        new apiError(400, "Pay cycle (YYYY-MM) is required")
      );
    }

    if (!/^\d{4}-\d{2}$/.test(payCycle)) {
      return res.status(400).json(
        new apiError(400, "Invalid pay cycle format. Use YYYY-MM (e.g., 2024-01)")
      );
    }

    // Validate pay cycle is not in future
    const [year, month] = payCycle.split("-");
    const cycleDate = new Date(year, parseInt(month) - 1);
    if (cycleDate > new Date()) {
      return res.status(400).json(
        new apiError(400, "Cannot run payroll for future pay cycles")
      );
    }

    // Fetch all active employees
    const employees = await Employee.find({ status: "Active" })
      .select("_id name salaryBand department")
      .lean();

    if (employees.length === 0) {
      return res.status(400).json(
        new apiError(400, "No active employees found")
      );
    }

    // Salary configuration (can be moved to a configuration collection)
    const salaryConfig = {
      "Band A": { baseSalary: 50000, tax: 5000, pf: 2500 },
      "Band B": { baseSalary: 30000, tax: 3000, pf: 1500 },
      "Band C": { baseSalary: 15000, tax: 1500, pf: 750 },
      default: { baseSalary: 10000, tax: 1000, pf: 500 },
    };

    const payrollRecords = [];
    const errors = [];

    for (const emp of employees) {
      try {
        // Get salary config for this employee's band
        const config = salaryConfig[emp.salaryBand] || salaryConfig.default;

        // Calculate tax and PF as percentage of base salary
        const baseSalary = config.baseSalary;
        const tax = baseSalary * 0.1; // 10% tax
        const pf = baseSalary * 0.05; // 5% PF

        // Create or update payroll record
        const payroll = await Payroll.findOneAndUpdate(
          { employee: emp._id, payCycle },
          {
            $setOnInsert: {
              employee: emp._id,
              payCycle,
              baseSalary,
              bonus: 0,
              tax,
              providentFund: pf,
              dearestAllowance: 0,
              houseRentAllowance: 0,
              medicalAllowance: 0,
              leaseDeduction: 0,
              otherDeductions: 0,
              status: "Draft",
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        payrollRecords.push(payroll);
      } catch (empError) {
        errors.push({
          employeeId: emp._id,
          employeeName: emp.name,
          error: empError.message,
        });
      }
    }

    // Log audit trail
    await ActivityLog.create({
      actor: req.user._id,
      action: "create_payroll",
      entityType: "Payroll",
      entityId: null,
      details: {
        payCycle,
        processedCount: payrollRecords.length,
        errorCount: errors.length,
      },
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(
        200,
        {
          message: `Payroll run completed for cycle ${payCycle}`,
          processedCount: payrollRecords.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : null,
        },
        "Payroll generation successful"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update Payroll Record (Draft Status Only)
 * HR can adjust salary components before approval
 */
export const updatePayroll = async (req, res, next) => {
  try {
    // RBAC
    if (!["Super Admin", "Admin", "HR"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only HR can update payroll")
      );
    }

    const { payrollId } = req.params;
    const {
      bonus,
      dearestAllowance,
      houseRentAllowance,
      medicalAllowance,
      leaseDeduction,
      otherDeductions,
      remarks,
    } = req.body;

    // Fetch payroll
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json(
        new apiError(404, "Payroll record not found")
      );
    }

    // Only allow updates in Draft status
    if (payroll.status !== "Draft") {
      return res.status(400).json(
        new apiError(400, `Cannot update payroll in ${payroll.status} status. Only Draft records can be updated.`)
      );
    }

    // Validation: all numeric fields must be non-negative
    const updateData = {};
    if (bonus !== undefined) {
      if (bonus < 0) {
        return res.status(400).json(new apiError(400, "Bonus cannot be negative"));
      }
      updateData.bonus = bonus;
    }
    if (dearestAllowance !== undefined) {
      if (dearestAllowance < 0) {
        return res.status(400).json(new apiError(400, "DA cannot be negative"));
      }
      updateData.dearestAllowance = dearestAllowance;
    }
    if (houseRentAllowance !== undefined) {
      if (houseRentAllowance < 0) {
        return res.status(400).json(new apiError(400, "HRA cannot be negative"));
      }
      updateData.houseRentAllowance = houseRentAllowance;
    }
    if (medicalAllowance !== undefined) {
      if (medicalAllowance < 0) {
        return res.status(400).json(new apiError(400, "Medical allowance cannot be negative"));
      }
      updateData.medicalAllowance = medicalAllowance;
    }
    if (leaseDeduction !== undefined) {
      if (leaseDeduction < 0) {
        return res.status(400).json(new apiError(400, "Lease deduction cannot be negative"));
      }
      updateData.leaseDeduction = leaseDeduction;
    }
    if (otherDeductions !== undefined) {
      if (otherDeductions < 0) {
        return res.status(400).json(new apiError(400, "Other deductions cannot be negative"));
      }
      updateData.otherDeductions = otherDeductions;
    }
    if (remarks !== undefined) {
      updateData.remarks = remarks.substring(0, 500); // Limit to 500 chars
    }

    // Update and recalculate net salary
    Object.assign(payroll, updateData);
    await payroll.save();

    // Log audit trail
    await ActivityLog.create({
      actor: req.user._id,
      action: "update_payroll",
      entityType: "Payroll",
      entityId: payroll._id,
      details: { updatedFields: Object.keys(updateData) },
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(200, payroll, "Payroll updated successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Payroll for Approval (HR → Accountant)
 */
export const submitPayroll = async (req, res, next) => {
  try {
    if (!["Super Admin", "Admin", "HR"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only HR can submit payroll")
      );
    }

    const { payrollId } = req.params;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json(
        new apiError(404, "Payroll record not found")
      );
    }

    if (payroll.status !== "Draft") {
      return res.status(400).json(
        new apiError(400, `Cannot submit payroll in ${payroll.status} status`)
      );
    }

    payroll.status = "Submitted";
    await payroll.save();

    await ActivityLog.create({
      actor: req.user._id,
      action: "submit_payroll",
      entityType: "Payroll",
      entityId: payroll._id,
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(200, payroll, "Payroll submitted for approval")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Approve Payroll (Accountant Role Only)
 */
export const approvePayroll = async (req, res, next) => {
  try {
    // Only Accountant and Super Admin can approve
    if (!["Super Admin", "Admin", "Accountant"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only Accountant can approve payroll")
      );
    }

    const { payrollId } = req.params;
    const { notes } = req.body;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json(
        new apiError(404, "Payroll record not found")
      );
    }

    if (payroll.status !== "Submitted") {
      return res.status(400).json(
        new apiError(400, `Cannot approve payroll in ${payroll.status} status. Expected: Submitted`)
      );
    }

    // Approve
    payroll.approve(req.user._id, notes || null);
    await payroll.save();

    // Log audit
    await ActivityLog.create({
      actor: req.user._id,
      action: "approve_payroll",
      entityType: "Payroll",
      entityId: payroll._id,
      details: { notes },
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(200, payroll, "Payroll approved successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Payroll (Accountant Role Only)
 */
export const rejectPayroll = async (req, res, next) => {
  try {
    if (!["Super Admin", "Admin", "Accountant"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only Accountant can reject payroll")
      );
    }

    const { payrollId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json(
        new apiError(400, "Rejection reason is required")
      );
    }

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json(
        new apiError(404, "Payroll record not found")
      );
    }

    if (!["Submitted", "Approved"].includes(payroll.status)) {
      return res.status(400).json(
        new apiError(400, `Cannot reject payroll in ${payroll.status} status`)
      );
    }

    // Reject
    payroll.reject(req.user._id, reason);
    await payroll.save();

    // Log
    await ActivityLog.create({
      actor: req.user._id,
      action: "reject_payroll",
      entityType: "Payroll",
      entityId: payroll._id,
      details: { reason },
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(200, payroll, "Payroll rejected successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Process Payroll (Accountant: Mark as Ready for Payment)
 * Creates ledger entry for accounting
 */
export const processPayroll = async (req, res, next) => {
  try {
    if (!["Super Admin", "Admin", "Accountant"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only Accountant can process payroll")
      );
    }

    const { payCycleMonth } = req.body;

    if (!payCycleMonth) {
      return res.status(400).json(
        new apiError(400, "Pay cycle month (YYYY-MM) is required")
      );
    }

    if (!/^\d{4}-\d{2}$/.test(payCycleMonth)) {
      return res.status(400).json(
        new apiError(400, "Invalid format. Use YYYY-MM")
      );
    }

    // Fetch all approved payrolls for this cycle
    const payrolls = await Payroll.getApprovedForProcessing(payCycleMonth);

    if (payrolls.length === 0) {
      return res.status(400).json(
        new apiError(400, `No approved payrolls found for cycle ${payCycleMonth}`)
      );
    }

    const processedPayrolls = [];
    const errors = [];

    for (const payroll of payrolls) {
      try {
        // Mark as processed
        payroll.markProcessed(req.user._id);

        // Create accounting ledger entry
        // Debit: Salary Expense Account
        // Credit: Bank/Payables Account
        const ledgerEntry = await LedgerEntry.create({
          date: new Date(),
          description: `Salary payment for ${payCycleMonth}`,
          debitAccount: "Salary Expense",
          debitAmount: payroll.netSalary,
          creditAccount: "Bank",
          creditAmount: payroll.netSalary,
          reference: `PAYROLL-${payroll._id}`,
          type: "Expense",
        });

        payroll.ledgerEntry = ledgerEntry._id;
        await payroll.save();
        processedPayrolls.push(payroll);
      } catch (err) {
        errors.push({
          payrollId: payroll._id,
          error: err.message,
        });
      }
    }

    // Log audit
    await ActivityLog.create({
      actor: req.user._id,
      action: "process_payroll",
      entityType: "Payroll",
      entityId: null,
      details: {
        payCycle: payCycleMonth,
        processedCount: processedPayrolls.length,
        errorCount: errors.length,
      },
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(
        200,
        {
          processedCount: processedPayrolls.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : null,
        },
        "Payroll processed and ledger entries created"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Payroll as Paid
 */
export const markPayrollAsPaid = async (req, res, next) => {
  try {
    if (!["Super Admin", "Admin", "Accountant"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized: Only Accountant can mark payroll as paid")
      );
    }

    const { payrollId } = req.params;
    const { paymentDate, transactionId, paymentMethod = "Bank Transfer" } = req.body;

    if (!paymentDate) {
      return res.status(400).json(
        new apiError(400, "Payment date is required")
      );
    }

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json(
        new apiError(404, "Payroll record not found")
      );
    }

    if (payroll.status !== "Processed") {
      return res.status(400).json(
        new apiError(400, `Cannot mark as paid. Current status: ${payroll.status}. Expected: Processed`)
      );
    }

    payroll.markPaid(new Date(paymentDate), transactionId, paymentMethod);
    await payroll.save();

    await ActivityLog.create({
      actor: req.user._id,
      action: "mark_payroll_paid",
      entityType: "Payroll",
      entityId: payroll._id,
      details: { transactionId, method: paymentMethod },
      timestamp: new Date(),
    });

    return res.status(200).json(
      new apiResponse(200, payroll, "Payroll marked as paid")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Payroll Statistics for a Pay Cycle
 */
export const getPayrollStatistics = async (req, res, next) => {
  try {
    if (!["Super Admin", "Admin", "HR", "Accountant"].includes(req.user?.role)) {
      return res.status(403).json(
        new apiError(403, "Unauthorized")
      );
    }

    const { payCycle } = req.query;

    if (!payCycle) {
      return res.status(400).json(
        new apiError(400, "Pay cycle (YYYY-MM) is required")
      );
    }

    if (!/^\d{4}-\d{2}$/.test(payCycle)) {
      return res.status(400).json(
        new apiError(400, "Invalid format. Use YYYY-MM")
      );
    }

    const stats = await Payroll.getCycleStatistics(payCycle);

    if (!stats) {
      return res.status(200).json(
        new apiResponse(200, {
          totalEmployees: 0,
          totalGross: 0,
          totalBonus: 0,
          totalDeductions: 0,
          totalNet: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        }, "No payroll records found for cycle")
      );
    }

    return res.status(200).json(
      new apiResponse(200, stats, "Payroll statistics retrieved")
    );
  } catch (error) {
    next(error);
  }
};