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

/**
 * @route POST /api/admin/add-candidate
 * @desc Add a new candidate (admin only)
 */
router.post("/add-candidate", protect, adminOnly, addCandidate);

/**
 * @route GET /api/admin/candidates
 * @desc Get all candidates (public or admin view)
 */
router.get("/candidates", getCandidates);

/**
 * @route GET /api/admin/all-candidates
 * @desc Get all candidates (flat admin summary)
 */
router.get("/all-candidates", protect, adminOnly, getAllCandidates);

/**
 * @route GET /api/admin/vote-summary
 * @desc Get voting summary (admin only)
 */
router.get("/vote-summary", protect, adminOnly, getVoteSummary);

/**
 * @route DELETE /api/admin/reset-all
 * @desc Reset all votes (admin only)
 */
router.delete("/reset-all", protect, adminOnly, resetAllVotes);

/**
 * @route POST /api/admin/reset
 * @desc Reset votes for a specific position (admin only)
 */
router.post("/reset", protect, adminOnly, resetVotes);

export default router;
