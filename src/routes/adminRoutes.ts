import express from "express";
import {
  getCandidates,
  addCandidate,
  getVoteSummary as getAdminVoteSummary,
  getAllCandidates,
} from "../controllers/adminController";
import { resetAllVotes, resetVotes, verifyVoteCounts } from "../controllers/voteController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/admin/candidates:
 *   get:
 *     summary: Get all candidates (public view)
 *     description: |
 *       Retrieve a list of all candidates in the system with public information. This endpoint is accessible without authentication and returns candidate data formatted for public display.
 *       Candidates are sorted by position and then by name.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Unique candidate identifier
 *                     example: "507f1f77bcf86cd799439011"
 *                   id:
 *                     type: string
 *                     description: Duplicate of _id for convenience
 *                     example: "507f1f77bcf86cd799439011"
 *                   name:
 *                     type: string
 *                     description: Candidate's full name
 *                     example: "John Doe"
 *                   position:
 *                     type: string
 *                     description: Position the candidate is running for
 *                     example: "President"
 *                   department:
 *                     type: string
 *                     description: Candidate's department
 *                     example: "Computer Science"
 *                   image:
 *                     type: string
 *                     description: URL or path to candidate's profile image
 *                     example: "https://example.com/images/john-doe.jpg"
 *                   votes:
 *                     type: number
 *                     description: Legacy votes field (deprecated)
 *                     example: 0
 *                   totalVotes:
 *                     type: number
 *                     description: Total number of votes received
 *                     example: 120
 *       500:
 *         description: Internal server error
 */
router.get("/candidates", getCandidates);

/**
 * @swagger
 * /api/admin/candidates:
 *   post:
 *     summary: Create a new candidate (Admin only)
 *     description: |
 *       Add a new candidate to the voting system. This endpoint requires admin authentication.
 *       All fields (name, position, department, image) are required.
 *       The candidate can optionally be associated with a category using categoryId.
 *       
 *       **Image Upload:** You can either provide an image URL in the request body or upload an image file (if using multipart/form-data).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - position
 *               - department
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Candidate's full name
 *                 example: "John Doe"
 *               position:
 *                 type: string
 *                 description: Position the candidate is running for
 *                 example: "President"
 *               department:
 *                 type: string
 *                 description: Candidate's department
 *                 example: "Computer Science"
 *               image:
 *                 type: string
 *                 description: URL or path to candidate's profile image
 *                 example: "https://example.com/images/john-doe.jpg"
 *               categoryId:
 *                 type: string
 *                 description: Optional category ID to associate the candidate with a category
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 position:
 *                   type: string
 *                   example: "President"
 *                 department:
 *                   type: string
 *                   example: "Computer Science"
 *                 image:
 *                   type: string
 *                   example: "https://example.com/images/john-doe.jpg"
 *                 categoryId:
 *                   type: string
 *                   nullable: true
 *                   example: "507f1f77bcf86cd799439011"
 *                 totalVotes:
 *                   type: number
 *                   example: 0
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All fields (name, position, department, image) are required."
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Category not found (if categoryId is provided)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category not found."
 *       409:
 *         description: Candidate already exists for this position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Candidate \"John Doe\" already exists for \"President\"."
 *       500:
 *         description: Internal server error
 */
router.post("/candidates", protect, adminOnly, addCandidate);

/**
 * @swagger
 * /api/admin/add-candidate:
 *   post:
 *     summary: Create a new candidate - alternative endpoint (Admin only)
 *     description: |
 *       Alternative endpoint for creating a new candidate. This is an alias for POST /api/admin/candidates.
 *       See the /api/admin/candidates POST endpoint for detailed documentation.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - position
 *               - department
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               position:
 *                 type: string
 *               department:
 *                 type: string
 *               image:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin privileges required
 *       409:
 *         description: Candidate already exists
 */
router.post("/add-candidate", protect, adminOnly, addCandidate);

/**
 * @swagger
 * /api/admin/all-candidates:
 *   get:
 *     summary: Get all candidates with full details (Admin only)
 *     description: |
 *       Retrieve all candidates with complete administrative details including MongoDB document fields.
 *       This endpoint is restricted to administrators and returns the full candidate documents from the database.
 *       Candidates are sorted by position and then by name.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   position:
 *                     type: string
 *                     example: "President"
 *                   department:
 *                     type: string
 *                     example: "Computer Science"
 *                   image:
 *                     type: string
 *                     example: "https://example.com/images/john-doe.jpg"
 *                   categoryId:
 *                     type: string
 *                     nullable: true
 *                     example: "507f1f77bcf86cd799439011"
 *                   totalVotes:
 *                     type: number
 *                     example: 120
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 */
router.get("/all-candidates", protect, adminOnly, getAllCandidates);

/**
 * @swagger
 * /api/admin/vote-summary:
 *   get:
 *     summary: Get vote summary by category (Admin only)
 *     description: |
 *       Retrieve a comprehensive vote summary organized by categories. This endpoint provides administrators with detailed voting statistics including:
 *       - Total number of categories
 *       - For each category:
 *         - Category name
 *         - Total number of candidates
 *         - For each candidate:
 *           - Candidate name
 *           - Department
 *           - Total votes received
 *       
 *       This summary helps administrators understand voting patterns across different categories.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved vote summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalCategories:
 *                   type: number
 *                   description: Total number of categories
 *                   example: 3
 *                 summary:
 *                   type: array
 *                   description: Array of category summaries
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         description: Category name
 *                         example: "Best Developer"
 *                       totalCandidates:
 *                         type: number
 *                         description: Number of candidates in this category
 *                         example: 5
 *                       results:
 *                         type: array
 *                         description: Array of candidate results
 *                         items:
 *                           type: object
 *                           properties:
 *                             candidateName:
 *                               type: string
 *                               example: "John Doe"
 *                             department:
 *                               type: string
 *                               example: "Computer Science"
 *                             totalVotes:
 *                               type: number
 *                               example: 120
 *             example:
 *               success: true
 *               totalCategories: 2
 *               summary:
 *                 - category: "Best Developer"
 *                   totalCandidates: 3
 *                   results:
 *                     - candidateName: "John Doe"
 *                       department: "Computer Science"
 *                       totalVotes: 120
 *                     - candidateName: "Jane Smith"
 *                       department: "Mathematics"
 *                       totalVotes: 85
 *                 - category: "Best Designer"
 *                   totalCandidates: 2
 *                   results:
 *                     - candidateName: "Bob Johnson"
 *                       department: "Art"
 *                       totalVotes: 95
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 */
router.get("/vote-summary", protect, adminOnly, getAdminVoteSummary);

/**
 * @swagger
 * /api/admin/votes/summary:
 *   get:
 *     summary: Get vote summary by category - alternative endpoint (Admin only)
 *     description: |
 *       Alternative endpoint for getting vote summary. This is an alias for GET /api/admin/vote-summary.
 *       See the /api/admin/vote-summary GET endpoint for detailed documentation.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved vote summary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get("/votes/summary", protect, adminOnly, getAdminVoteSummary);

/**
 * @swagger
 * /api/admin/votes/reset:
 *   post:
 *     summary: Reset votes for a specific position (Admin only)
 *     description: |
 *       Reset all votes for candidates in a specific position. This operation will:
 *       - Delete all vote records for the specified position
 *       - Set totalVotes to 0 for all candidates in that position
 *       - Clear demo votes for that position
 *       
 *       **Warning:** This operation is irreversible. All votes for the specified position will be permanently deleted.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *             properties:
 *               position:
 *                 type: string
 *                 description: Position name to reset votes for
 *                 example: "President"
 *     responses:
 *       200:
 *         description: Votes reset successfully for the position
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
 *                   example: "Votes for position \"President\" have been reset."
 *       400:
 *         description: Missing position parameter
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
 *                   example: "Position is required."
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 */
router.post("/votes/reset", protect, adminOnly, resetVotes);

/**
 * @swagger
 * /api/admin/reset:
 *   post:
 *     summary: Reset votes for a specific position - alternative endpoint (Admin only)
 *     description: |
 *       Alternative endpoint for resetting votes by position. This is an alias for POST /api/admin/votes/reset.
 *       See the /api/admin/votes/reset POST endpoint for detailed documentation.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *             properties:
 *               position:
 *                 type: string
 *     responses:
 *       200:
 *         description: Votes reset successfully
 *       400:
 *         description: Missing position
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.post("/reset", protect, adminOnly, resetVotes);

/**
 * @swagger
 * /api/admin/votes/reset-all:
 *   delete:
 *     summary: Reset all votes in the system (Admin only)
 *     description: |
 *       Reset all votes across the entire system. This operation will:
 *       - Delete all vote records from the database
 *       - Set totalVotes to 0 for all candidates
 *       - Clear all demo votes
 *       
 *       **Warning:** This operation is irreversible and will permanently delete all voting data. Use with extreme caution.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All votes reset successfully
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
 *                   example: "All votes have been reset."
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 */
router.delete("/votes/reset-all", protect, adminOnly, resetAllVotes);

/**
 * @swagger
 * /api/admin/reset-all:
 *   delete:
 *     summary: Reset all votes - alternative endpoint (Admin only)
 *     description: |
 *       Alternative endpoint for resetting all votes. This is an alias for DELETE /api/admin/votes/reset-all.
 *       See the /api/admin/votes/reset-all DELETE endpoint for detailed documentation.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All votes reset successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.delete("/reset-all", protect, adminOnly, resetAllVotes);

/**
 * @swagger
 * /api/admin/votes/verify:
 *   post:
 *     summary: Verify and sync vote counts (Admin only)
 *     description: |
 *       Verify that Candidate.totalVotes matches the actual count of Vote documents for each candidate.
 *       If discrepancies are found, they will be automatically corrected by updating Candidate.totalVotes
 *       to match the actual vote count from the Vote collection.
 *       
 *       This endpoint helps ensure data consistency and should be run periodically or when vote counts
 *       seem incorrect.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vote counts verified and synced
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
 *                   example: "Verified and synced 3 candidate vote count(s)."
 *                 synced:
 *                   type: number
 *                   description: Number of candidates that had their vote counts synced
 *                   example: 3
 *                 discrepancies:
 *                   type: array
 *                   description: Array of discrepancies found and corrected
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateId:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       storedCount:
 *                         type: number
 *                         description: Vote count stored in Candidate.totalVotes
 *                         example: 100
 *                       actualCount:
 *                         type: number
 *                         description: Actual vote count from Vote collection
 *                         example: 105
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 */
router.post("/votes/verify", protect, adminOnly, verifyVoteCounts);

export default router;
