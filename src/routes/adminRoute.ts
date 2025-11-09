import express from "express";
import {
  getCandidates,
  addCandidate,
  getVoteSummary,
  getAllCandidates,
} from "../controllers/adminController";
import { resetAllVotes, resetVotes } from "../controllers/voteController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/add-candidate", protect, adminOnly, addCandidate);
router.get("/candidates", getCandidates);
router.get("/all-candidates", protect, adminOnly, getAllCandidates);
router.get("/vote-summary", protect, adminOnly, getVoteSummary);
router.delete("/reset-all", protect, adminOnly, resetAllVotes);
router.post("/reset", protect, adminOnly, resetVotes);

export default router;

