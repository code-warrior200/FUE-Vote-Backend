import express from "express";
import { getAllCandidates } from "../controllers/candidateController.js";

const router = express.Router();
router.get("/", getAllCandidates);

/**
 * @swagger
 * /api/candidates:
 *   get:
 *      tags: [Candidates]
 *     summary: Get all candidates grouped by category
 *     responses:
 *       200:
 *         description: List of candidates grouped by category
 */

export default router;
