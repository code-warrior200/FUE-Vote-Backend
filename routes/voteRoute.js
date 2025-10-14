import express from "express";
import {
  castVote,
  resetAllVotes,
  resetVotesByCategory,
  resetMyVotes,
} from "../controllers/voteController.js";
import { protect, adminOnly, voterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🗳️ Voters
router.post("/", protect, voterOnly, castVote);
router.delete("/reset", protect, voterOnly, resetMyVotes);

// 🧹 Admins
router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);
router.delete("/admin/reset-category/:categoryId", protect, adminOnly, resetVotesByCategory);

export default router;
