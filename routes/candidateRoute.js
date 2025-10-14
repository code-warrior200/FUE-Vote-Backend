import express from "express";
import { getAllCandidates } from "../controllers/candidateController.js";

const router = express.Router();
router.get("/", getAllCandidates);

export default router;
