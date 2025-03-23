import express from "express";
import sign from "./sign.js";
import home from "./home.js";
import ml from "./ml.js";
import forms from "./forms.js";
import users from "./users.js";

const router = express.Router();
router.use("/sign", sign);
router.use("/", home);
router.use("/ml", ml);
router.use("/forms", forms);
router.use("/users", users);

export default router;
