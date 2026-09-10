import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import User from "../models/User.model.js";

/**
 * Verify JWT and attach user to request
 * Token expected in: cookies.accessToken OR Authorization header (Bearer)
 */
export const verifyJWT = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json(
        new apiError(401, "Access token missing")
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json(
          new apiError(401, "Access token expired — use refresh endpoint")
        );
      }
      return res.status(403).json(
        new apiError(403, "Invalid token")
      );
    }

    // Fetch fresh user from DB (role/permissions may have changed)
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    if (!user) {
      return res.status(401).json(
        new apiError(401, "User not found")
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(
      new apiError(401, "Authentication failed")
    );
  }
};

/**
 * RBAC: Check if user has any of the allowed roles
 * Usage: requireRole("Super Admin", "Admin")(req, res, next)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        new apiError(401, "User not authenticated")
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        new apiError(
          403,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        )
      );
    }

    next();
  };
};

/**
 * RBAC: Specific permission checks by module & action
 * Example: checkPermission("projects", "create")
 */
export const checkPermission = (module, action) => {
  const permissions = {
    // User Management
    users: {
      create: ["Super Admin", "Admin"],
      read: ["Super Admin", "Admin", "Manager", "HR"],
      update: ["Super Admin", "Admin"],
      delete: ["Super Admin"],
    },
    // Employee Management
    employees: {
      create: ["Super Admin", "Admin", "HR"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
      update: ["Super Admin", "Admin", "HR"],
      delete: ["Super Admin"],
    },
    // Leave Management
    leaves: {
      create: ["Super Admin", "Admin", "Manager", "HR", "Accountant", "Employee"],
      approve: ["Super Admin", "Admin", "Manager", "HR"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
      delete: ["Super Admin"],
    },
    // Payroll
    payroll: {
      create: ["Super Admin", "Admin", "HR", "Accountant"],
      read: ["Super Admin", "Admin", "HR", "Accountant"],
      update: ["Super Admin", "Admin", "Accountant"],
      delete: ["Super Admin"],
    },
    // Project Management
    projects: {
      create: ["Super Admin", "Admin", "Manager", "HR"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant", "Employee"],
      update: ["Super Admin", "Admin", "Manager"],
      delete: ["Super Admin"],
      assignTask: ["Super Admin", "Admin", "Manager"],
      autoArrange: ["Super Admin", "Admin", "Manager"],
    },
    // Inventory
    inventory: {
      create: ["Super Admin", "Admin", "Manager"],
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
      update: ["Super Admin", "Admin", "Manager"],
      delete: ["Super Admin"],
    },
    // Sales
    sales: {
      create: ["Super Admin", "Admin", "Manager"],
      read: ["Super Admin", "Admin", "Manager", "Accountant"],
      update: ["Super Admin", "Admin", "Manager"],
      delete: ["Super Admin"],
    },
    // Accounting
    accounting: {
      create: ["Super Admin", "Admin", "Accountant"],
      read: ["Super Admin", "Admin", "Accountant"],
      update: ["Super Admin", "Admin", "Accountant"],
      delete: ["Super Admin"],
    },
    // CRM
    crm: {
      create: ["Super Admin", "Admin", "Manager"],
      read: ["Super Admin", "Admin", "Manager"],
      update: ["Super Admin", "Admin", "Manager"],
      delete: ["Super Admin"],
    },
    // Reports
    reports: {
      read: ["Super Admin", "Admin", "Manager", "HR", "Accountant"],
      generate: ["Super Admin", "Admin"],
    },
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        new apiError(401, "User not authenticated")
      );
    }

    const allowedRoles = permissions[module]?.[action];
    if (!allowedRoles) {
      return res.status(400).json(
        new apiError(400, `Permission check not defined for ${module}.${action}`)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        new apiError(
          403,
          `Insufficient permissions for ${action} on ${module}`
        )
      );
    }

    next();
  };
};

/**
 * Rate limiting: prevent brute force attacks
 * In production, use external service (Redis-based)
 */
const loginAttempts = new Map();

export const rateLimitLogin = (req, res, next) => {
  const identifier = req.body.email || req.body.username;

  if (!identifier) {
    return res.status(400).json(
      new apiError(400, "Email or username required")
    );
  }

  const attemptData = loginAttempts.get(identifier) || { count: 0, lastAttempt: Date.now() };

  // Reset counter if 15 minutes have passed
  if (Date.now() - attemptData.lastAttempt > 15 * 60 * 1000) {
    attemptData.count = 0;
  }

  if (attemptData.count >= 5) {
    return res.status(429).json(
      new apiError(429, "Too many login attempts. Try again in 15 minutes.")
    );
  }

  attemptData.count++;
  attemptData.lastAttempt = Date.now();
  loginAttempts.set(identifier, attemptData);

  next();
};

/**
 * CSRF protection: verify request source
 * Token should be in request body, query, or X-CSRF-Token header
 */
export const verifyCsrfToken = (req, res, next) => {
  const token = req.body._csrf || req.query._csrf || req.header("X-CSRF-Token");

  if (!token) {
    return res.status(403).json(
      new apiError(403, "CSRF token missing")
    );
  }

  // In production, validate token against session/store
  // For now, basic check that token exists and is non-empty
  if (typeof token !== "string" || token.length < 10) {
    return res.status(403).json(
      new apiError(403, "Invalid CSRF token")
    );
  }

  next();
};

/**
 * XSS Protection: Sanitize request body
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized = {};
    for (const key in obj) {
      const value = obj[key];
      // Remove script tags and dangerous patterns
      if (typeof value === "string") {
        sanitized[key] = value
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim();
      } else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  };

  req.body = sanitize(req.body);
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, sanitizedQuery);
  }
  next();
};