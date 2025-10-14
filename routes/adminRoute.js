import express from "express";
import { getVoteSummary } from "../controllers/adminController.js";
import { resetAllVotes } from "../controllers/voteController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
// import { verifyAdmin } from "../middleware/auth.js"; // optional for admin auth

const router = express.Router();

router.delete("/admin/reset-all", protect, adminOnly, resetAllVotes);

router.post("/reset", protect, adminOnly, resetVotes);

// GET vote summary (admin only)
router.get("/vote-summary", /*verifyAdmin,*/ getVoteSummary);

export default router;
