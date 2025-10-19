// routes/adminRoutes.js
import express from "express";
import {
  getCandidates,
  addCandidate,
  getVoteSummary,
} from "../controllers/adminController.js";
import { resetAllVotes, resetVotes } from "../controllers/voteController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/admin/add-candidate
 * @desc Add a new candidate (admin only)
 */
router.post("/add-candidate", protect, adminOnly, async (req, res) => {
  try {
    const candidate = await addCandidate(req, res);

    // Ensure controller didn't already send a response
    if (res.headersSent) return;

    return res.status(201).json({
      success: true,
      message: "Candidate added successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("❌ Error in POST /api/admin/add-candidate:", error);

    // Unified error structure
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error while adding candidate",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * @route GET /api/admin/candidates
 * @desc Get all candidates (public or admin view)
 */
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await getCandidates(req, res);

    if (res.headersSent) return;

    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/admin/candidates:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching candidates",
    });
  }
});

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

/**
 * @route GET /api/admin/vote-summary
 * @desc Get voting summary (admin only)
 */
router.get("/vote-summary", protect, adminOnly, getVoteSummary);

export default router;
