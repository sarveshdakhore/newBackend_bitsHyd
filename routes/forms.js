import express from "express";
import { getRecentFormSubmissions, getUserFormMetrics } from "../controllers/forms.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/metrics", getUserFormMetrics);
router.get("/recent", getRecentFormSubmissions);

export default router;
