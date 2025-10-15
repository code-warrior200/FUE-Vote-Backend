import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const router = express.Router();

// ✅ Temporary in-memory user (for demonstration)
const user = { id: 1, username: "admin", password: "admin123", regnumber: "12345" };

// ✅ Allow frontend access (important for CORS)
router.use(
  cors({
    origin: "*", // 🔒 Replace with your frontend domain in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Parse JSON request body
router.use(express.json());

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints for login and accessing protected data
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login (by username/password or student ID)
 *     description: Authenticates a user and returns a signed JWT token if credentials are valid.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *               regnumber:
 *                 type: string
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: Login successful — JWT and user info returned.
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin
 *                     regnumber:
 *                       type: string
 *                       example: 12345
 *       401:
 *         description: Invalid credentials.
 *       500:
 *         description: Internal server error.
 */
router.post("/login", (req, res) => {
  const { username, password, regnumber } = req.body;

  // Support both username/password and regnumber-based login
  const isValidByUsername = username === user.username && password === user.password;
  const isValidByStudentId = regnumber && regnumber === user.regnumber;

  if (!isValidByUsername && !isValidByStudentId) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, regnumber: user.regnumber },
  });
});

/**
 * @swagger
 * /auth/dashboard:
 *   get:
 *     summary: Get dashboard stats (protected route)
 *     description: Returns dashboard data for authenticated users. Requires a valid JWT in the `Authorization` header.
 *     tags: [Auth]
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
 *                 users:
 *                   type: integer
 *                   example: 100
 *                 votes:
 *                   type: integer
 *                   example: 250
 *                 admin:
 *                   type: string
 *                   example: admin
 *       401:
 *         description: Unauthorized — missing or invalid token.
 *       500:
 *         description: Internal server error.
 */
router.get("/dashboard", (req, res) => {
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
    console.log("✅ Authenticated user:", decoded);
    return res.json({ users: 100, votes: 250, admin: decoded.username });
  } catch (error) {
    console.error("JWT error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
