import express from "express";
import { castVote, getVoteSummary, resetDemoVotes } from "../controllers/voteController";
import { protect, voterOnly, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/vote:
 *   post:
 *     summary: Cast a vote or multiple votes
 *     description: |
 *       Authenticated voters can cast votes for one or more candidates. This endpoint supports two modes:
 *       
 *       **Single Vote Mode:** Vote for one candidate in one position
 *       ```json
 *       {
 *         "candidateId": "507f1f77bcf86cd799439011",
 *         "position": "President"
 *       }
 *       ```
 *       
 *       **Batch Vote Mode:** Vote for multiple candidates in different positions in a single request
 *       ```json
 *       {
 *         "votes": [
 *           { "candidateId": "507f1f77bcf86cd799439011", "position": "President" },
 *           { "candidateId": "507f1f77bcf86cd799439012", "position": "Vice President" }
 *         ]
 *       }
 *       ```
 *       
 *       **Important Notes:**
 *       - Each voter can only vote once per position
 *       - If a voter has already voted for a position, the new vote will replace the previous vote
 *       - Voters cannot vote for multiple candidates in the same position in a single submission
 *       - The voter's registration number is automatically extracted from the JWT token
 *       - Votes are processed atomically (all or nothing)
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: Single vote mode
 *                 required:
 *                   - candidateId
 *                   - position
 *                 properties:
 *                   candidateId:
 *                     type: string
 *                     description: MongoDB ObjectId of the candidate
 *                     example: "507f1f77bcf86cd799439011"
 *                   position:
 *                     type: string
 *                     description: Position the candidate is running for
 *                     example: "President"
 *                   isDemo:
 *                     type: boolean
 *                     description: Whether this is a demo vote (optional)
 *                     example: false
 *               - type: object
 *                 description: Batch vote mode
 *                 required:
 *                   - votes
 *                 properties:
 *                   votes:
 *                     type: array
 *                     description: Array of vote objects
 *                     items:
 *                       type: object
 *                       required:
 *                         - candidateId
 *                         - position
 *                       properties:
 *                         candidateId:
 *                           type: string
 *                           description: MongoDB ObjectId of the candidate
 *                           example: "507f1f77bcf86cd799439011"
 *                         position:
 *                           type: string
 *                           description: Position the candidate is running for
 *                           example: "President"
 *                   isDemo:
 *                     type: boolean
 *                     description: Whether these are demo votes (optional)
 *                     example: false
 *           examples:
 *             singleVote:
 *               summary: Single vote example
 *               value:
 *                 candidateId: "507f1f77bcf86cd799439011"
 *                 position: "President"
 *             batchVote:
 *               summary: Batch vote example
 *               value:
 *                 votes:
 *                   - candidateId: "507f1f77bcf86cd799439011"
 *                     position: "President"
 *                   - candidateId: "507f1f77bcf86cd799439012"
 *                     position: "Vice President"
 *     responses:
 *       200:
 *         description: Vote submission completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vote submission complete."
 *                 results:
 *                   type: array
 *                   description: Array of vote processing results for each position
 *                   items:
 *                     type: object
 *                     properties:
 *                       position:
 *                         type: string
 *                         example: "President"
 *                       status:
 *                         type: string
 *                         enum: [success, error]
 *                         example: "success"
 *                       message:
 *                         type: string
 *                         example: "✅ Your vote for \"John Doe\" as \"President\" has been recorded successfully."
 *             example:
 *               success: true
 *               message: "Vote submission complete."
 *               results:
 *                 - position: "President"
 *                   status: "success"
 *                   message: "✅ Your vote for \"John Doe\" as \"President\" has been recorded successfully."
 *                 - position: "Vice President"
 *                   status: "success"
 *                   message: "✅ Your vote for \"Jane Smith\" as \"Vice President\" has been recorded successfully."
 *       400:
 *         description: Invalid request - missing fields, duplicate positions, or invalid candidate IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Invalid request body. Provide candidateId/position or votes array."
 *                     - "Missing voter registration number"
 *                     - "Invalid candidate ID: invalid_id"
 *                     - "You can only vote for one candidate per position in a single submission."
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired token"
 *       403:
 *         description: Forbidden - voter privileges required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied. Voters only."
 *       404:
 *         description: One or more candidates not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "One or more candidates were not found."
 *                 missingCandidateIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["507f1f77bcf86cd799439099"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Candidate \"507f1f77bcf86cd799439011\" has no position configured."
 */
router.post("/", protect, voterOnly, castVote);

/**
 * @swagger
 * /api/vote/summary:
 *   get:
 *     summary: Get voting results summary
 *     description: |
 *       Retrieve a comprehensive summary of all voting results grouped by position. This endpoint is publicly accessible and returns:
 *       - All positions with their candidates
 *       - Total votes for each candidate (real votes)
 *       - Demo votes for each candidate (if any)
 *       - Candidate information (name, department, image)
 *       
 *       The results are organized by position, making it easy to see which candidate is leading in each position.
 *     tags: [Votes]
 *     responses:
 *       200:
 *         description: Vote summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Candidate ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       description: Candidate name
 *                       example: "John Doe"
 *                     department:
 *                       type: string
 *                       description: Candidate department
 *                       example: "Computer Science"
 *                     image:
 *                       type: string
 *                       description: Candidate image URL
 *                       example: "https://example.com/images/john-doe.jpg"
 *                     totalVotes:
 *                       type: number
 *                       description: Total real votes received
 *                       example: 120
 *                     demoVotes:
 *                       type: number
 *                       description: Total demo votes received
 *                       example: 5
 *             example:
 *               President:
 *                 - id: "507f1f77bcf86cd799439011"
 *                   name: "John Doe"
 *                   department: "Computer Science"
 *                   image: "https://example.com/images/john-doe.jpg"
 *                   totalVotes: 120
 *                   demoVotes: 5
 *                 - id: "507f1f77bcf86cd799439012"
 *                   name: "Jane Smith"
 *                   department: "Mathematics"
 *                   image: "https://example.com/images/jane-smith.jpg"
 *                   totalVotes: 85
 *                   demoVotes: 3
 *               "Vice President":
 *                 - id: "507f1f77bcf86cd799439013"
 *                   name: "Bob Johnson"
 *                   department: "Physics"
 *                   image: "https://example.com/images/bob-johnson.jpg"
 *                   totalVotes: 95
 *                   demoVotes: 2
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
router.get("/summary", getVoteSummary);

/**
 * @swagger
 * /api/vote/demo/reset:
 *   post:
 *     summary: Reset demo votes (Admin only)
 *     description: |
 *       Reset all demo votes and set candidate vote totals to zero. This endpoint is restricted to administrators only.
 *       Demo votes are votes cast in demo mode (typically for testing purposes).
 *       
 *       **Warning:** This operation is irreversible and will clear all demo vote data.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demo votes reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Demo votes have been reset."
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired token"
 *       403:
 *         description: Forbidden - admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied. Admins only."
 *       500:
 *         description: Internal server error
 */
router.post("/demo/reset", protect, adminOnly, resetDemoVotes);

export default router;

