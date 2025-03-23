import express from "express";
import {
  updateUserAttributes,
  getUserAttributes,
  removeUserAttributes,
} from "../controllers/ml/data.js";
import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

// User attributes routes
router.patch("/users/:userId/update-attributes", updateUserAttributes);
router.get("/users/:userId/attributes", getUserAttributes);
router.delete("/users/:userId/attributes", removeUserAttributes);

export default router;
