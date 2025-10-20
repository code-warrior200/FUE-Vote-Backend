import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect, voterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/vote
 * @desc Cast a vote for a candidate
 * @access Private (authenticated voters only)
 */
router.post("/", protect, voterOnly, async (req, res) => {
  try {
    if (!req.user?.regnumber) {
      console.warn("⚠️ Missing regnumber in authenticated request");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: voter regnumber missing in token",
      });
    }

    console.log(`🗳️ Vote request by ${req.user.regnumber}`);
    const result = await castVote(req, res);

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
