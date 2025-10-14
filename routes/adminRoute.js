import express from "express";
import { getVoteSummary } from "../controllers/adminController.js";
// import { verifyAdmin } from "../middleware/auth.js"; // optional for admin auth

const router = express.Router();

// GET vote summary (admin only)
router.get("/vote-summary", /*verifyAdmin,*/ getVoteSummary);

export default router;
