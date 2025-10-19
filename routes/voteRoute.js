// routes/voteRoutes.js
import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect, voterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/vote
 * @desc Cast a vote for a candidate
 * @access Private (authenticated voters only)
 */
router.post("/", voterOnly, async (req, res) => {
  try {
    const result = await castVote(req, res);

    // In case controller handled the response already
    if (res.headersSent) return;

    return res.status(200).json({
      success: true,
      message: "Vote cast successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error in POST /api/vote:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to cast vote",
    });
  }
});

export default router;
