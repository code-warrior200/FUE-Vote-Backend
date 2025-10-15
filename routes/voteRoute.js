import express from "express";
import {
  castVote,
  resetAllVotes,
  resetVotesByCategory,
  resetMyVotes,
} from "../controllers/voteController.js";
import { protect, adminOnly, voterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/vote:
 *   post:
 *     tags: [Votes]
 *     summary: Submit a vote
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vote successfully recorded
 */


// 🗳️ Voters
router.post("/", protect, voterOnly, castVote);
router.delete("/reset", protect, voterOnly, resetMyVotes);

// 🧹 Admins
router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);
router.delete("/admin/reset-category/:categoryId", protect, adminOnly, resetVotesByCategory);

export default router;
