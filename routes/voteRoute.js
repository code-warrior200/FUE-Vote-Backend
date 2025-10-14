import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/vote
router.post("/", protect, castVote);

export default router;
