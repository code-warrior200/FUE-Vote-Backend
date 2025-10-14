import express from "express";
import { getVoteSummary } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/votes/summary", protect, adminOnly, getVoteSummary);

export default router;
