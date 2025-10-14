import express from "express";
import {
  castVote,
  resetAllVotes,
  resetVotesByCategory,
  resetMyVotes,
} from "../controllers/voteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Cast vote (voter only)
router.post("/", protect, castVote);

// Reset own votes (voter)
router.delete("/reset", protect, resetMyVotes);

// Reset all votes (admin)
router.delete("/admin/reset-all", protect, resetAllVotes);

// Reset votes by category (admin)
router.delete("/admin/reset-category/:categoryId", protect, resetVotesByCategory);

export default router;
