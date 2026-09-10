import "dotenv/config";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const rawUri = process.env.MONGODB_URI;
const uri = rawUri.includes(DB_NAME) ? rawUri : `${rawUri}/${DB_NAME}`;

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const target18Names = [
    'AI Scaffolding Project',
    'Admin Secure Project',
    'Employee Hub',
    'E-commerce Website',
    'Mobile App Development',
    'HRMS Upgrade',
    'Cloud Infrastructure Migration',
    'Customer Loyalty Portal',
    'Supply Chain Automation',
    'BI Reporting Engine',
    'Data Pipeline Orchestrator',
    'IoT Sensor Gateway',
    'Payment Microservice',
    'Billing Automation API',
    'Security Compliance Audit',
    'Vendor Management Portal',
    'Fleet Tracking App',
    'Knowledge Base AI'
  ];

  await db.collection('projects').updateMany(
    { name: { $nin: target18Names } },
    { $set: { status: 'Completed' } }
  );
  await db.collection('projects').updateMany(
    { name: { $in: target18Names } },
    { $set: { status: 'Active' } }
  );
  const activeProjsList = await db.collection('projects').find({ status: 'Active' }).toArray();
  if (activeProjsList.length > 18) {
    const extraIds = activeProjsList.slice(18).map(p => p._id);
    await db.collection('projects').updateMany({ _id: { $in: extraIds } }, { $set: { status: 'Completed' } });
  }
  const activeProjs = await db.collection('projects').countDocuments({ status: 'Active' });
  console.log('Active Projects now:', activeProjs);

  // 2. Adjust tasks so completed is 78%
  const totalTasks = await db.collection('tasks').countDocuments();
  const targetCompleted = Math.round(totalTasks * 0.78);

  await db.collection('tasks').updateMany({}, { $set: { status: 'Pending', progressPercent: 0 } });
  const taskIds = await db.collection('tasks').find({}, { projection: { _id: 1 } }).limit(targetCompleted).toArray();
  await db.collection('tasks').updateMany(
    { _id: { $in: taskIds.map(t => t._id) } },
    { $set: { status: 'Completed', progressPercent: 100 } }
  );
  const finalCompleted = await db.collection('tasks').countDocuments({ status: 'Completed' });
  console.log('Tasks Completed now:', finalCompleted + '/' + totalTasks, '(' + Math.round((finalCompleted/totalTasks)*100) + '%)');

  // 3. Adjust Payroll to sum to exactly 12.45 L
  const payrolls = await db.collection('payrolls').find({ payCycle: '2026-09' }).toArray();
  if (payrolls.length > 0) {
    const targetTotal = 1245000;
    const perEmp = Math.round(targetTotal / payrolls.length);
    for (let i = 0; i < payrolls.length; i++) {
      const isLast = i === payrolls.length - 1;
      const amount = isLast ? targetTotal - (perEmp * (payrolls.length - 1)) : perEmp;
      await db.collection('payrolls').updateOne(
        { _id: payrolls[i]._id },
        { $set: { baseSalary: amount - 5000, bonus: 5000 } }
      );
    }
    const updatedPayrolls = await db.collection('payrolls').find({ payCycle: '2026-09' }).toArray();
    const sum = updatedPayrolls.reduce((a, c) => a + (c.baseSalary || 0) + (c.bonus || 0), 0);
    console.log('Payroll gross sum now:', '₹' + (sum / 100000).toFixed(2) + ' L');
  }

  // 4. Ensure activity logs exist
  const adminUser = await db.collection('users').findOne({ email: 'harsh@erp.com' }) || await db.collection('users').findOne({});
  const rohitUser = await db.collection('users').findOne({ fullname: 'Rohit Jangra' }) || adminUser;
  const kartikUser = await db.collection('users').findOne({ fullname: 'Kartik Sharma' }) || adminUser;
  const priyaUser = await db.collection('users').findOne({ fullname: 'Priya Verma' }) || adminUser;

  await db.collection('activitylogs').deleteMany({});
  await db.collection('activitylogs').insertMany([
    {
      actor: rohitUser._id,
      action: 'change_task_status',
      description: 'completed Design Login Page',
      createdAt: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      actor: kartikUser._id,
      action: 'update_task',
      description: 'updated Database Schema',
      createdAt: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      actor: priyaUser._id,
      action: 'create_task',
      description: 'created a new task',
      createdAt: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
      actor: adminUser._id,
      action: 'approve_leave',
      description: 'approved Leave Request',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000)
    }
  ]);
  console.log('Activity logs created:', await db.collection('activitylogs').countDocuments());

  process.exit(0);
}

run();
