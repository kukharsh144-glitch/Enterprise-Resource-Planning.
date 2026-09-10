import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";
import {
  analyzeProject,
  getAnalysis,
  recommendNextTask,
  approvePlan
} from "../controllers/aiProject.controller.js";

const router = Router();

router.use(verifyJWT);

router.post(
  "/:id/ai/analyze",
  authorize(["Super Admin", "Admin", "Manager"]),
  analyzeProject
);

router.get(
  "/:id/ai/analysis",
  authorize(["Super Admin", "Admin", "Manager", "Employee", "HR"]),
  getAnalysis
);

router.get(
  "/:id/ai/next-task",
  authorize(["Super Admin", "Admin", "Manager", "Employee", "HR"]),
  recommendNextTask
);

router.post(
  "/:id/ai/approve",
  authorize(["Super Admin", "Admin", "Manager"]),
  approvePlan
);

export default router;
