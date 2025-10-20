import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect, voterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/vote
 * @desc Cast a vote for a candidate
 * @access Private (authenticated voters only)
 */
router.post("/", protect, voterOnly, castVote);

export default router;