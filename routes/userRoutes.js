import express from "express";
import { loginUser } from "../controllers/authController.js";

const router = express.Router();

// Only login route available (no registration)
router.post("/login", loginUser);

export default router;
