import { Router } from "express";
import {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  getAllUsers,
  updateUserRole,
  generateUsername,
  changePasswordWithDOB,
  changeAccountPassword,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ===== PUBLIC ROUTES =====
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);

// ===== SECURE ROUTES =====
router.use(verifyJWT);

// Self endpoints
router.get("/me", getCurrentUser);
router.put("/profile", updateProfile);
router.post("/logout", logout);
router.put("/profile/username", generateUsername);
router.put("/profile/password", changePasswordWithDOB);
router.put("/profile/change-password", changeAccountPassword);

// Admin-only endpoints
router.post(
  "/register",
  authorize(["Super Admin", "Admin"]),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  registerUser
);
router.get("/users", authorize(["Super Admin", "Admin"]), getAllUsers);
router.put("/users/:userId/role", authorize(["Super Admin"]), updateUserRole);

export default router;
