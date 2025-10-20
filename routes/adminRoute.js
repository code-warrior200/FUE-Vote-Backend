// routes/adminRoutes.js
import express from "express";
import {
  getCandidates,
  addCandidate,
  getVoteSummary,
  getAllCandidates,
} from "../controllers/adminController.js";
import { resetAllVotes, resetVotes } from "../controllers/voteController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/** -----------------------------
 * Candidate Management
 * ----------------------------*/

/**
 * @route   POST /api/admin/add-candidate
 * @desc    Add a new candidate (Admin only)
 */
router.post("/add-candidate", protect, adminOnly, addCandidate);

/**
 * @route   GET /api/admin/candidates
 * @desc    Get all candidates (public or admin view)
 */
router.get("/candidates", getCandidates);

/**
 * @route   GET /api/admin/all-candidates
 * @desc    Get all candidates (flat list for admin)
 */
router.get("/all-candidates", protect, adminOnly, getAllCandidates);

/** -----------------------------
 * Voting Summary
 * ----------------------------*/

/**
 * @route   GET /api/admin/vote-summary
 * @desc    Get vote summary for all candidates (Admin only)
 */
router.get("/vote-summary", protect, adminOnly, getVoteSummary);

/** -----------------------------
 * Vote Reset Endpoints
 * ----------------------------*/

/**
 * @route   DELETE /api/admin/reset-all
 * @desc    Reset all votes (Admin only)
 */
router.delete("/reset-all", protect, adminOnly, resetAllVotes);

/**
 * @route   POST /api/admin/reset
 * @desc    Reset votes for a specific position (Admin only)
 */
router.post("/reset", protect, adminOnly, resetVotes);

export default router;
