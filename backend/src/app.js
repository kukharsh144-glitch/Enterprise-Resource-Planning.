import "dotenv/config";

import express from "express";
import http from "http";

import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { Server } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import projectRoutes from "./routes/project.route.js";
import aiProjectRoutes from "./routes/aiProject.route.js";
import taskRoutes from "./routes/task.route.js";
import employeeRoutes from "./routes/employee.route.js";
import leaveRoutes from "./routes/leave.route.js";
import assetRoutes from "./routes/asset.route.js";
import departmentRoutes from "./routes/department.route.js";
import payrollRoutes from "./routes/payroll.route.js";
import customerRoutes from "./routes/customer.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import orderRoutes from "./routes/order.route.js";
import productRoutes from "./routes/product.route.js";
import expenseRoutes from "./routes/expense.route.js";
import invoiceRoutes from "./routes/invoice.route.js";
import supplierRoutes from "./routes/supplier.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import systemSettingRoutes from "./routes/systemSetting.route.js";

const app = express();

const server =
  http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'PUT'],
    credentials: true,
  },
});

app.set("io", io);

io.on(
  "connection",
  (socket) => {
    console.log(
      "Socket connected:",
      socket.id
    );

    socket.on(
      "project:join",
      (projectId) => {
        socket.join(
          `project:${projectId}`
        );
      }
    );

    socket.on(
      "project:leave",
      (projectId) => {
        socket.leave(
          `project:${projectId}`
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Socket disconnected:",
          socket.id
        );
      }
    );
  }
);

app.use(helmet());

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(cookieParser());

app.use(morgan("dev"));

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      service:
        "ERP Project Backend",
    });
  }
);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", aiProjectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", systemSettingRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app, server };