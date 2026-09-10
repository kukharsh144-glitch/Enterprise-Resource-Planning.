import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/User.model.js";
import Department from "../models/Department.model.js";
import Employee from "../models/Employee.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import Leave from "../models/Leave.model.js";
import Asset from "../models/Asset.model.js";
import Payroll from "../models/Payroll.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import { DB_NAME } from "../constants.js";

const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_URI = rawUri.includes(DB_NAME) ? rawUri : `${rawUri}/${DB_NAME}`;

export async function seedDashboardDatabase() {
  console.log(`Connecting to MongoDB (${DB_NAME}) for Dashboard seeding...`);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  console.log("Seeding core reference data...");

  // 1. Departments
  const deptNames = [
    { name: "Engineering", code: "ENG", description: "Software, Architecture & DevOps" },
    { name: "Design", code: "DES", description: "UI/UX, Branding & Visual Design" },
    { name: "Product", code: "PRD", description: "Product Strategy & Management" },
    { name: "HR", code: "HR", description: "Talent, People & Operations" },
    { name: "Finance", code: "FIN", description: "Accounting, Payroll & Audit" },
    { name: "Sales", code: "SLS", description: "Client Growth & Account Management" },
  ];

  const deptMap = {};
  for (const d of deptNames) {
    let existing = await Department.findOne({ name: d.name });
    if (!existing) {
      existing = await Department.create(d);
    }
    deptMap[d.name] = existing._id;
  }

  // 2. Core Users & Employees
  const corePeople = [
    {
      fullname: "Harsh Saini",
      email: "harsh@erp.com",
      role: "Super Admin",
      designation: "Chief Technology Officer",
      dept: "Engineering",
      employeeId: "EMP-0001",
      phone: "+91 98765 43210"
    },
    {
      fullname: "Rohit Jangra",
      email: "rohit@erp.com",
      role: "Employee",
      designation: "Senior Frontend Engineer",
      dept: "Engineering",
      employeeId: "EMP-0002",
      phone: "+91 98765 43211"
    },
    {
      fullname: "Kartik Sharma",
      email: "kartik@erp.com",
      role: "Employee",
      designation: "Backend Architect",
      dept: "Engineering",
      employeeId: "EMP-0003",
      phone: "+91 98765 43212"
    },
    {
      fullname: "Priya Verma",
      email: "priya@erp.com",
      role: "Employee",
      designation: "Lead Product Designer",
      dept: "Design",
      employeeId: "EMP-0004",
      phone: "+91 98765 43213"
    },
    {
      fullname: "Vikram Singh",
      email: "vikram@erp.com",
      role: "Employee",
      designation: "DevOps & Cloud Engineer",
      dept: "Engineering",
      employeeId: "EMP-0005",
      phone: "+91 98765 43214"
    },
  ];

  const hashedPw = await bcrypt.hash("Password@123", 10);
  const employeeRecords = [];

  for (const p of corePeople) {
    const uname = p.fullname.toLowerCase().replace(/\s+/g, "");
    let u = await User.findOne({ $or: [{ email: p.email }, { username: uname }] });
    if (!u) {
      u = await User.create({
        fullname: p.fullname,
        username: uname,
        email: p.email,
        password: hashedPw,
        role: p.role,
        isVerified: true
      });
    }

    const defaultAddress = {
      address: "DLF Cyber City, Sector 24",
      city: "Gurugram",
      state: "Haryana",
      pinCode: "122002",
      country: "India"
    };

    let emp = await Employee.findOne({ $or: [{ user: u._id }, { employeeId: p.employeeId }] });
    if (!emp) {
      emp = await Employee.create({
        user: u._id,
        department: deptMap[p.dept] || deptMap["Engineering"],
        designation: p.designation,
        employeeId: p.employeeId,
        salaryBand: "Band 4",
        experience: 5,
        weeklyCapacityHours: 40,
        status: "Active",
        phone: p.phone,
        dateOfBirth: new Date("1995-05-15"),
        gender: "Male",
        maritalStatus: "Single",
        employmentType: "Full-Time",
        workLocation: "Office",
        currentAddress: defaultAddress,
        permanentAddress: defaultAddress,
        skills: ["React", "Node.js", "MongoDB", "Architecture"]
      });
    } else {
      emp.user = u._id;
      emp.department = deptMap[p.dept] || deptMap["Engineering"];
      if (!emp.phone) emp.phone = p.phone || "+91 98765 43210";
      if (!emp.employeeId) emp.employeeId = p.employeeId || "EMP-0001";
      if (!emp.dateOfBirth) emp.dateOfBirth = new Date("1995-05-15");
      if (!emp.gender) emp.gender = "Male";
      if (!emp.maritalStatus) emp.maritalStatus = "Single";
      if (!emp.employmentType) emp.employmentType = "Full-Time";
      if (!emp.workLocation) emp.workLocation = "Office";
      if (!emp.currentAddress?.address) emp.currentAddress = defaultAddress;
      if (!emp.permanentAddress?.address) emp.permanentAddress = defaultAddress;
      await emp.save();
    }
    employeeRecords.push({ user: u, employee: emp });
  }

  const primaryManager = employeeRecords[0].employee._id;
  const primaryAdminUser = employeeRecords[0].user._id;

  // 3. Ensure 18 Active Projects
  console.log("Seeding 18 Active Projects matching the screenshot...");
  const projectDefinitions = [
    {
      name: "AI Scaffolding Project",
      description: "Generative AI templates, project skeleton automation and neural code generation.",
      startDate: new Date("2026-06-01"),
      deadline: new Date("2026-09-20"),
      actualProgress: 78,
      status: "Active",
      priority: "High",
      totalTasks: 54,
      completedTasks: 42
    },
    {
      name: "Admin Secure Project",
      description: "Role-based access control, biometric verification and zero-trust perimeter defense.",
      startDate: new Date("2026-06-15"),
      deadline: new Date("2026-09-25"),
      actualProgress: 64,
      status: "Active",
      priority: "High",
      totalTasks: 44,
      completedTasks: 28
    },
    {
      name: "Employee Hub",
      description: "Unified corporate intranet, self-service payroll vouchers and leave management.",
      startDate: new Date("2026-06-20"),
      deadline: new Date("2026-09-30"),
      actualProgress: 48,
      status: "Active",
      priority: "Medium",
      totalTasks: 42,
      completedTasks: 20
    },
    {
      name: "E-commerce Website",
      description: "High-volume multi-currency storefront, Stripe billing and real-time inventory hooks.",
      startDate: new Date("2026-07-01"),
      deadline: new Date("2026-10-15"),
      actualProgress: 32,
      status: "Active",
      priority: "High",
      totalTasks: 50,
      completedTasks: 16
    },
    {
      name: "Mobile App Development",
      description: "Cross-platform mobile companion for enterprise task management and offline sync.",
      startDate: new Date("2026-07-10"),
      deadline: new Date("2026-10-18"),
      actualProgress: 18,
      status: "Active",
      priority: "Medium",
      totalTasks: 35,
      completedTasks: 6
    },
    {
      name: "HRMS Upgrade",
      description: "Next-gen employee lifecycle management, compliance reporting and performance reviews.",
      startDate: new Date("2026-07-15"),
      deadline: new Date("2026-10-28"),
      actualProgress: 12,
      status: "Active",
      priority: "Low",
      totalTasks: 28,
      completedTasks: 3
    },
    // Additional 12 projects to reach 18 active projects
    { name: "Cloud Infrastructure Migration", actualProgress: 85, deadline: new Date("2026-11-01"), totalTasks: 30, completedTasks: 25 },
    { name: "Customer Loyalty Portal", actualProgress: 52, deadline: new Date("2026-11-10"), totalTasks: 25, completedTasks: 13 },
    { name: "Supply Chain Automation", actualProgress: 40, deadline: new Date("2026-11-15"), totalTasks: 40, completedTasks: 16 },
    { name: "BI Reporting Engine", actualProgress: 75, deadline: new Date("2026-11-20"), totalTasks: 36, completedTasks: 27 },
    { name: "Data Pipeline Orchestrator", actualProgress: 60, deadline: new Date("2026-11-25"), totalTasks: 28, completedTasks: 17 },
    { name: "IoT Sensor Gateway", actualProgress: 35, deadline: new Date("2026-12-01"), totalTasks: 22, completedTasks: 8 },
    { name: "Payment Microservice", actualProgress: 90, deadline: new Date("2026-12-05"), totalTasks: 20, completedTasks: 18 },
    { name: "Billing Automation API", actualProgress: 45, deadline: new Date("2026-12-10"), totalTasks: 32, completedTasks: 14 },
    { name: "Security Compliance Audit", actualProgress: 70, deadline: new Date("2026-12-15"), totalTasks: 18, completedTasks: 13 },
    { name: "Vendor Management Portal", actualProgress: 55, deadline: new Date("2026-12-20"), totalTasks: 24, completedTasks: 13 },
    { name: "Fleet Tracking App", actualProgress: 25, deadline: new Date("2026-12-28"), totalTasks: 30, completedTasks: 8 },
    { name: "Knowledge Base AI", actualProgress: 65, deadline: new Date("2027-01-10"), totalTasks: 26, completedTasks: 17 }
  ];

  for (const def of projectDefinitions) {
    let p = await Project.findOne({ name: def.name });
    if (!p) {
      p = await Project.create({
        name: def.name,
        description: def.description || `Enterprise initiative for ${def.name}`,
        startDate: def.startDate || new Date("2026-06-15"),
        deadline: def.deadline,
        actualProgress: def.actualProgress,
        expectedProgress: def.actualProgress + 5,
        status: "Active",
        priority: def.priority || "Medium",
        manager: primaryManager
      });
    } else {
      p.actualProgress = def.actualProgress;
      p.deadline = def.deadline;
      p.status = "Active";
      await p.save();
    }

    // Seed tasks for this project
    const existingTasks = await Task.countDocuments({ project: p._id });
    if (existingTasks < def.totalTasks) {
      const taskBatch = [];
      for (let t = 0; t < def.totalTasks; t++) {
        const isCompleted = t < def.completedTasks;
        taskBatch.push({
          project: p._id,
          assignedTo: primaryManager,
          title: `${def.name} Deliverable #${t + 1}`,
          description: `Execution module specifications for task #${t + 1}`,
          status: isCompleted ? "Completed" : t < def.completedTasks + 3 ? "In Progress" : "Pending",
          progressPercent: isCompleted ? 100 : t < def.completedTasks + 3 ? 50 : 0,
          priority: isCompleted ? "Medium" : "High",
          estimatedHours: 16,
          actualHours: isCompleted ? 16 : 4,
          dueDate: new Date(def.deadline.getTime() - ((def.totalTasks - t) * 86400000))
        });
      }
      await Task.insertMany(taskBatch);
    }
  }

  // 4. Pending Leaves (7 records awaiting approval)
  console.log("Seeding 7 Pending Leaves...");
  const pendingLeavesCount = await Leave.countDocuments({ status: "Applied" });
  if (pendingLeavesCount < 7) {
    const toCreateLeaves = 7 - pendingLeavesCount;
    const leaveTypes = ["Casual", "Sick", "Paid"];
    const allEmps = await Employee.find().limit(20);
    const leaveBatch = [];

    for (let l = 0; l < toCreateLeaves; l++) {
      const emp = allEmps[l % allEmps.length];
      leaveBatch.push({
        employee: emp._id,
        type: leaveTypes[l % leaveTypes.length],
        status: "Applied",
        startDate: new Date(Date.now() + (l + 1) * 86400000 * 2),
        endDate: new Date(Date.now() + (l + 3) * 86400000 * 2),
        reason: "Personal family event & urgent vacation schedule."
      });
    }
    await Leave.insertMany(leaveBatch);
  }

  // 5. Assets (128 total records)
  console.log("Seeding 128 Assets...");
  const assetCount = await Asset.countDocuments();
  if (assetCount < 128) {
    const toCreateAssets = 128 - assetCount;
    const assetTypes = ["Laptop", "Monitor", "Printer", "Equipment", "Furniture"];
    const assetBatch = [];
    const timestamp = Date.now();

    for (let a = 0; a < toCreateAssets; a++) {
      const idx = assetCount + a + 1;
      const type = assetTypes[a % assetTypes.length];
      const isAssigned = a < 96; // ~75% assigned, rest available
      assetBatch.push({
        name: `Dell UltraSharp / MacBook Pro #${idx}`,
        type,
        serialNumber: `SN-ERP-${timestamp}-${idx}`,
        status: isAssigned ? "Assigned" : "Available",
        assignedTo: isAssigned ? primaryManager : null,
        createdBy: primaryAdminUser,
        description: `Enterprise asset device unit ${idx}`,
        purchaseDate: new Date(Date.now() - idx * 86400000 * 3),
        purchaseCost: 85000
      });
    }
    await Asset.insertMany(assetBatch);
  }

  // 6. Monthly Payroll Spend (~₹12.45 Lakhs)
  console.log("Seeding Monthly Payroll records...");
  const currentPayCycle = "2026-09";
  const existingPayroll = await Payroll.findOne({ payCycle: currentPayCycle });
  if (!existingPayroll) {
    // 25 records with base salaries summing up to ~12.45 Lakhs
    const payrollBatch = [];
    const allEmps = await Employee.find().limit(25);
    const avgSalary = Math.round(1245000 / allEmps.length);

    for (let i = 0; i < allEmps.length; i++) {
      const emp = allEmps[i];
      payrollBatch.push({
        employee: emp._id,
        payCycle: currentPayCycle,
        baseSalary: avgSalary,
        bonus: 5000,
        tax: Math.round(avgSalary * 0.1),
        providentFund: Math.round(avgSalary * 0.12),
        netSalary: Math.round(avgSalary * 0.78),
        status: "Approved",
        paymentMethod: "Bank Transfer"
      });
    }
    await Payroll.insertMany(payrollBatch);
  }

  // 7. Recent Activity Logs
  console.log("Seeding Recent Activity Logs...");
  const recentLogsCount = await ActivityLog.countDocuments();
  if (recentLogsCount < 4) {
    const rohitUser = employeeRecords.find(e => e.user.fullname === "Rohit Jangra")?.user._id || primaryAdminUser;
    const kartikUser = employeeRecords.find(e => e.user.fullname === "Kartik Sharma")?.user._id || primaryAdminUser;
    const priyaUser = employeeRecords.find(e => e.user.fullname === "Priya Verma")?.user._id || primaryAdminUser;

    const activityBatch = [
      {
        actor: rohitUser,
        action: "change_task_status",
        entityType: "Task",
        entityId: primaryManager,
        description: "completed Design Login Page",
        ipAddress: "192.168.1.10",
        createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2m ago
      },
      {
        actor: kartikUser,
        action: "update_task",
        entityType: "Task",
        entityId: primaryManager,
        description: "updated Database Schema",
        ipAddress: "192.168.1.11",
        createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15m ago
      },
      {
        actor: priyaUser,
        action: "create_task",
        entityType: "Task",
        entityId: primaryManager,
        description: "created a new task",
        ipAddress: "192.168.1.12",
        createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1h ago
      },
      {
        actor: primaryAdminUser,
        action: "approve_leave",
        entityType: "Leave",
        entityId: primaryManager,
        description: "approved Leave Request",
        ipAddress: "192.168.1.1",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000) // 2h ago
      }
    ];

    await ActivityLog.insertMany(activityBatch);
  }

  console.log("✅ Dashboard database seeding completed successfully!");
}

// Allow standalone execution
if (process.argv[1]?.endsWith("seedDashboard.js")) {
  seedDashboardDatabase().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error("Dashboard seed failed:", err);
    process.exit(1);
  });
}
