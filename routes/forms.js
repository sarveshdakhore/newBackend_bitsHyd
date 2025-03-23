import express from "express";
import { getUserFormMetrics } from "../controllers/dashboard/forms.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/metrics", getUserFormMetrics);

export default router;
