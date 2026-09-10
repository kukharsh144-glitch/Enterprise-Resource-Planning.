import { Router } from "express";
import { getDashboardStats, queryAssistant } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Live dashboard overview data from MongoDB
router.get("/stats", getDashboardStats);

// Claude AI Assistant query
router.post("/assistant", queryAssistant);

export default router;
