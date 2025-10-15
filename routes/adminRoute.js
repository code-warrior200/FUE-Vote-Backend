import express from "express";
import { getVoteSummary } from "../controllers/adminController.js";
import { resetAllVotes } from "../controllers/voteController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and vote control
 */

/**
 * @swagger
 * /admin/reset-all:
 *   delete:
 *     summary: Reset all votes (admin only)
 *     description: Deletes or resets all vote data in the system. Requires authentication and admin privileges.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All votes have been reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All votes have been reset.
 *       401:
 *         description: Unauthorized - Missing or invalid token.
 *       403:
 *         description: Forbidden - Admin privileges required.
 *       500:
 *         description: Internal server error.
 */
router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);

/**
 * @swagger
 * /admin/reset:
 *   post:
 *     summary: Reset specific votes (admin only)
 *     description: Allows an admin to reset certain votes or voting data. Requires authentication and admin privileges.
 *     tags: [Admin]
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
 *                   example: Votes have been reset.
 *       401:
 *         description: Unauthorized - Missing or invalid token.
 *       403:
 *         description: Forbidden - Admin privileges required.
 *       500:
 *         description: Internal server error.
 */
router.post("/reset", protect, adminOnly, resetVotes);

/**
 * @swagger
 * /admin/vote-summary:
 *   get:
 *     summary: Get vote summary (admin only)
 *     description: Retrieves a summary of all votes for admin review.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved vote summary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalVotes:
 *                   type: integer
 *                   example: 120
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Candidate A"
 *                       votes:
 *                         type: integer
 *                         example: 45
 *       401:
 *         description: Unauthorized - Missing or invalid token.
 *       403:
 *         description: Forbidden - Admin privileges required.
 *       500:
 *         description: Internal server error.
 */
router.get("/vote-summary", protect, adminOnly, getVoteSummary);

export default router;
