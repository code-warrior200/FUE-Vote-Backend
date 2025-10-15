import express from "express";
import { getVoteSummary } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations related to voting
 */

/**
 * @swagger
 * /admin/votes/summary:
 *   get:
 *     summary: Get vote summary (admin only)
 *     description: Retrieve a summary of all votes in the system. Accessible only by authenticated admins.
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
 *                   example: 150
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
 *                         example: 75
 *       401:
 *         description: Unauthorized - Missing or invalid token.
 *       403:
 *         description: Forbidden - Admin privileges required.
 *       500:
 *         description: Internal server error.
 */
router.get("/votes/summary", protect, adminOnly, getVoteSummary);

export default router;
