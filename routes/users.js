import express from "express";
import { getUserProfile, getCurrentUserProfile } from "../controllers/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", authMiddleware, getCurrentUserProfile);

router.get("/profile/:userId", getUserProfile);

export default router;
