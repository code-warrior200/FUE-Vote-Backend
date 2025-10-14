import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect } from "../middleware/authMiddleware.js"; // JWT verify

const router = express.Router();

router.post("/", protect, castVote);

export default router;
