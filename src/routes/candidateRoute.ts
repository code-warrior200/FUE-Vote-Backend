import express from "express";
import { getAllCandidates } from "../controllers/candidateController";

const router = express.Router();

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates
 *     description: Retrieve a list of all candidates available in the voting system. Returns candidate information including name, position, department, image, and vote counts. This endpoint is publicly accessible and does not require authentication.
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique candidate identifier (MongoDB ObjectId)
 *                     example: "507f1f77bcf86cd799439011"
 *                   name:
 *                     type: string
 *                     description: Candidate's full name
 *                     example: "John Doe"
 *                   dept:
 *                     type: string
 *                     description: Candidate's department
 *                     example: "Computer Science"
 *                   image:
 *                     type: string
 *                     description: URL or path to candidate's profile image
 *                     example: "https://example.com/images/john-doe.jpg"
 *                   position:
 *                     type: string
 *                     description: Position the candidate is running for
 *                     example: "President"
 *                   votes:
 *                     type: number
 *                     description: Legacy votes field (deprecated, use totalVotes)
 *                     example: 0
 *                   totalVotes:
 *                     type: number
 *                     description: Total number of votes received by the candidate
 *                     example: 120
 *             example:
 *               - id: "507f1f77bcf86cd799439011"
 *                 name: "John Doe"
 *                 dept: "Computer Science"
 *                 image: "https://example.com/images/john-doe.jpg"
 *                 position: "President"
 *                 votes: 0
 *                 totalVotes: 120
 *               - id: "507f1f77bcf86cd799439012"
 *                 name: "Jane Smith"
 *                 dept: "Mathematics"
 *                 image: "https://example.com/images/jane-smith.jpg"
 *                 position: "Vice President"
 *                 votes: 0
 *                 totalVotes: 85
 *       404:
 *         description: No candidates found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: {}
 *             example: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server encountered an error"
 */
router.get("/", getAllCandidates);

export default router;

