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
 * tags:
 *   name: Votes
 *   description: Voting operations for voters and admins
 */

/**
 * @swagger
 * /votes:
 *   post:
 *     summary: Cast a vote (voter only)
 *     description: Allows an authenticated voter to cast their vote for a candidate.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidateId:
 *                 type: string
 *                 example: "64f1d2e4b6f9a01234567890"
 *               categoryId:
 *                 type: string
 *                 example: "64f1d2e4b6f9a01234567891"
 *     responses:
 *       200:
 *         description: Vote cast successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vote recorded successfully.
 *       400:
 *         description: Bad request - missing or invalid data.
 *       401:
 *         description: Unauthorized - missing or invalid token.
 *       403:
 *         description: Forbidden - only voters can perform this action.
 *       500:
 *         description: Internal server error.
 */
router.post("/", protect, voterOnly, castVote);

/**
 * @swagger
 * /votes/reset:
 *   delete:
 *     summary: Reset my votes (voter only)
 *     description: Allows a voter to reset all of their votes.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Votes reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Your votes have been reset.
 *       401:
 *         description: Unauthorized - missing or invalid token.
 *       403:
 *         description: Forbidden - only voters can perform this action.
 *       500:
 *         description: Internal server error.
 */
router.delete("/reset", protect, voterOnly, resetMyVotes);

/**
 * @swagger
 * /votes/admin/reset-all:
 *   delete:
 *     summary: Reset all votes (admin only)
 *     description: Allows an admin to reset all votes across all categories and candidates.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All votes reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All votes have been reset.
 *       401:
 *         description: Unauthorized - missing or invalid token.
 *       403:
 *         description: Forbidden - only admins can perform this action.
 *       500:
 *         description: Internal server error.
 */
router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);

/**
 * @swagger
 * /votes/admin/reset-category/{categoryId}:
 *   delete:
 *     summary: Reset votes by category (admin only)
 *     description: Allows an admin to reset all votes within a specific category.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to reset votes for.
 *     responses:
 *       200:
 *         description: Votes for the specified category reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Votes for this category have been reset.
 *       400:
 *         description: Bad request - invalid category ID.
 *       401:
 *         description: Unauthorized - missing or invalid token.
 *       403:
 *         description: Forbidden - only admins can perform this action.
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/admin/reset-category/:categoryId", protect, adminOnly, resetVotesByCategory);

export default router;
