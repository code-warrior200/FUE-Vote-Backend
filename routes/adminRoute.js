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
 * POST /api/admin/add-candidate
 * Add a new candidate (admin only)
 */
router.post("/admin/add-candidate", protect, adminOnly, async (req, res) => {
  try {
    // addCandidate should handle validation and saving, and return the new candidate
    const result = await addCandidate(req, res);

    // If the controller already sent a response, don't send again
    if (!res.headersSent) {
      return res.status(201).json({
        success: true,
        message: "Candidate added successfully",
        candidate: result,
      });
    }
  } catch (error) {
    console.error("Error in /admin/add-candidate:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

/**
 * GET /api/admin/candidates
 * Return all candidates
 */
router.get("/admin/candidates", getCandidates,async (req, res) => {
  try {
    const candidates = await getCandidates(req, res);
    if (!res.headersSent) {
      return res.json(candidates);
    }
  } catch (error) {
    console.error("Error in GET /admin/candidates:", error);
    return res.status(500).json({ message: "Server error fetching candidates" });
  }
});

/**
 * DELETE /api/admin/reset-all
 */
router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);

/**
 * POST /api/admin/reset
 */
router.post("/admin/reset", protect, adminOnly, resetVotes);

/**
 * GET /api/admin/vote-summary
 */
router.get("/admin/vote-summary", protect, adminOnly, getVoteSummary);

export default router;
