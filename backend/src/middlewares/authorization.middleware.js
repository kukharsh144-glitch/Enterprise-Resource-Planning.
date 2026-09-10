import { apiError } from "../utils/apiError.js";

/**
 * RBAC: Route-level authorization guard
 * Usage: authorize(["Super Admin", "Admin", "HR"])
 *
 * Must run AFTER verifyJWT (relies on req.user being set).
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new apiError(401, "User not authenticated"));
    }

    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return next(
        new apiError(500, "No roles configured for this route")
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new apiError(
          403,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        )
      );
    }

    next();
  };
};

export default authorize;