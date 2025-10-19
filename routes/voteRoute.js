// routes/voteRoutes.js
import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /vote
 * @desc Cast a vote for a candidate
 * @access Private (authenticated users only)
 */
router.post("/", protect, castVote);

export default router;
