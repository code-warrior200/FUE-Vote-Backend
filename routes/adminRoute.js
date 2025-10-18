import express from "express";
import { getVoteSummary, addCandidate } from "../controllers/adminController.js";
import { resetAllVotes, resetVotes } from "../controllers/voteController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
// import { upload } from "../middleware/uploadMiddleware.js"; // ❌ Not needed for Cloudinary JSON uploads

const router = express.Router();

/**
 * @swagger
 * /admin/add-candidate:
 *   post:
 *     summary: Add a new candidate (admin only)
 *     description: Allows an admin to add a candidate to the system.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               department:
 *                 type: string
 *                 example: "Computer Science"
 *               position:
 *                 type: string
 *                 example: "President"
 *               image:
 *                 type: string
 *                 example: "https://example.com/john.jpg"
 *     responses:
 *       201:
 *         description: Candidate added successfully.
 *       400:
 *         description: Missing required fields or duplicate candidate.
 *       401:
 *         description: Unauthorized - Missing or invalid token.
 *       403:
 *         description: Forbidden - Admin privileges required.
 *       500:
 *         description: Server error.
 */

router.post("/add-candidate", protect, adminOnly,upload.single("image"), addCandidate), async (req, res, next) => {
  try {
    // ✅ Delegate to your controller and ensure JSON-only responses
    const result = await addCandidate(req, res);

    // If controller doesn’t send its own response, send a fallback
    if (!res.headersSent) {
      res.status(201).json({ success: true, message: "Candidate added successfully", result });
    }
  } catch (error) {
    console.error("Error in /admin/add-candidate:", error);

    // ✅ Always return JSON, never HTML
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message || "Server error" });
  }
}

// === Other Admin Routes ===
router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);
router.post("/reset", protect, adminOnly, resetVotes);
router.get("/vote-summary", protect, adminOnly, getVoteSummary);

export default router;
