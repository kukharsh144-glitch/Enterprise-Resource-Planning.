import { Router } from "express";
import {
  getSystemSettings,
  updateSystemSettings,
  triggerManualBackup,
  testSlackWebhook,
} from "../controllers/systemSetting.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

const router = Router();

// Protect all settings endpoints with JWT authentication
router.use(verifyJWT);

// Read settings & dynamic telemetry
router.get("/", getSystemSettings);

// Update system workspace parameters, security, notifications, and backup
router.put("/", authorize(["Super Admin", "Admin"]), updateSystemSettings);

// Instant manual snapshot action
router.post("/backup-now", authorize(["Super Admin", "Admin"]), triggerManualBackup);

// Test webhook dispatch
router.post("/test-webhook", authorize(["Super Admin", "Admin"]), testSlackWebhook);

export default router;
