import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";


const router = express.Router();

// ✅ Temporary in-memory voter for example
const voter = { id: 1, regnumber: "EZ/CSC2314/2025" };

// ✅ Allow frontend access (CORS)
router.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Parse JSON request body
router.use(express.json());

/**
 * @swagger
 * tags:
 *   name: VoterAuth
 *   description: Authentication routes for voters
 */

/**
 * @swagger
 * /auth/voter-login:
 *   post:
 *     summary: Voter login using registration number
 *     description: Allows a registered voter to log in using only their registration number and receive a JWT token.
 *     tags: [VoterAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - regnumber
 *             properties:
 *               regnumber:
 *                 type: string
 *                 example: "EZ/CSC2314/2025"
 *     responses:
 *       200:
 *         description: Login successful, JWT returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 voter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     regnumber:
 *                       type: string
 *                       example: EZ/CSC2314/2025
 *       401:
 *         description: Invalid registration number.
 *       500:
 *         description: Internal server error.
 */
router.post("/voter-login", (req, res) => {
  const { regnumber } = req.body;

  if (!regnumber || regnumber !== voter.regnumber) {
    return res.status(401).json({ message: "Invalid registration number" });
  }

  // ✅ Generate JWT token for voter
  const token = jwt.sign(
    { id: voter.id, regnumber: voter.regnumber },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Login successful",
    token,
    voter: { id: voter.id, regnumber: voter.regnumber },
  });
});

/**
 * @swagger
 * /auth/voter-dashboard:
 *   get:
 *     summary: Get voter dashboard (protected route)
 *     description: Returns basic voter information. Requires a valid JWT in the `Authorization` header.
 *     tags: [VoterAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to your dashboard
 *                 voter:
 *                   type: object
 *                   properties:
 *                     regnumber:
 *                       type: string
 *                       example: EZ/CSC2314/2025
 *       401:
 *         description: Unauthorized - missing or invalid token.
 *       500:
 *         description: Internal server error.
 */
router.get("/home", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );
    return res.json({
      message: "Welcome to your dashboard",
      voter: { regnumber: decoded.regnumber },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
