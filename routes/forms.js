import express from "express";
import { getUserFormMetrics } from "../controllers/forms.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/metrics", getUserFormMetrics);

export default router;
