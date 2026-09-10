import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorization.middleware.js";

import {
  aiPlan,
  createProject,
  getProgress,
  updateTaskStatus,
  updateTaskProgress,
  updateSubtaskCompletion,
  postTaskComment,
  postMessage,
  getActivity,
  triggerAutoArrange,
  getProjectMembers,
  addProjectMember,
  getEmployeeTasks,
  getTaskComments,
  getProjects,
  getProjectStatistics,
  allotPhaseEmployee,
  getMessages,
} from "../controllers/project.controller.js";

const router = Router();

router.use(verifyJWT);

// Project Planning & Creation
router.post(
  "/ai/plan",
  authorize(["Super Admin", "Admin", "Manager"]),
  aiPlan
);

router.post(
  "/",
  authorize(["Super Admin", "Admin", "Manager", "HR"]),
  createProject
);

// Projects retrieval & overview stats
router.get("/stats/overview", getProjectStatistics);
router.get("/", getProjects);

// Metrics & Activity Logs
router.get("/:id/progress", getProgress);
router.get("/:id/activity", getActivity);

// Phase level employee assignment
router.put(
  "/:id/phase/assign",
  authorize(["Super Admin", "Admin", "Manager"]),
  allotPhaseEmployee
);

// Auto-scheduling
router.post(
  "/:id/auto-arrange",
  authorize(["Super Admin", "Admin", "Manager"]),
  triggerAutoArrange
);

// Messages board
router.get("/:id/messages", getMessages);
router.post("/:id/messages", postMessage);

// Member management
router.get("/:id/members", getProjectMembers);
router.post(
  "/:id/members",
  authorize(["Super Admin", "Admin", "Manager"]),
  addProjectMember
);

// Task comments (Nested under project scope)
router.get("/tasks/:id/comments", getTaskComments);
router.post("/tasks/:id/comments", postTaskComment);

// Direct task status and progress updates
router.put(
  "/tasks/:id/status",
  authorize(["Super Admin", "Admin", "Manager", "Employee"]),
  updateTaskStatus
);
router.put(
  "/tasks/:id/progress",
  authorize(["Super Admin", "Admin", "Manager", "Employee"]),
  updateTaskProgress
);
router.patch(
  "/tasks/:id/completion",
  authorize(["Super Admin", "Admin", "Manager", "Employee"]),
  updateSubtaskCompletion
);

// Employee cross-project tasks
router.get("/employees/:id/my-tasks", getEmployeeTasks);

export default router;