import express, { type Request, type Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import {
  loginUser,
  loginVoter,
  loginAdmin,
  refreshToken,
} from "../controllers/authController";

const router = express.Router();

router.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
router.use(express.json());

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login as a registered user
 *     description: Authenticate a user with registration number and password. Returns a JWT token for accessing protected routes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - regnumber
 *               - password
 *             properties:
 *               regnumber:
 *                 type: string
 *                 description: User registration number
 *                 example: "EZ/CSC1001/2025"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password (minimum 6 characters)
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token (expires in 7 days)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     regnumber:
 *                       type: string
 *                       example: "EZ/CSC1001/2025"
 *                     role:
 *                       type: string
 *                       enum: [admin, voter]
 *                       example: "voter"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reg number and password required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/voter-login:
 *   post:
 *     summary: Login as a demo voter
 *     description: Authenticate a voter using only their registration number. This is a demo login that doesn't require a password. Registration number format is EZ followed by department code, number, and year (e.g., EZ/CSC1001/2025).
 *     tags: [Auth]
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
 *                 description: Voter registration number in format EZ/DEPARTMENT_CODE+NUMBER/2025 (example: EZ/CSC1001/2025)
 *                 example: "EZ/CSC1001/2025"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token for demo voter (expires in 7 days)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 voter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1"
 *                     regnumber:
 *                       type: string
 *                       example: "EZ/CSC1001/2025"
 *                     role:
 *                       type: string
 *                       example: "voter"
 *       400:
 *         description: Missing registration number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration number is required"
 *       401:
 *         description: Invalid registration number format or not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid registration number format" or "Registration number not found"
 *       500:
 *         description: Internal server error
 */
router.post("/voter-login", loginVoter);

/**
 * @swagger
 * /api/auth/admin-login:
 *   post:
 *     summary: Login as an administrator
 *     description: Authenticate an admin user with username and password. Default credentials are username: "admin" and password: "admin123".
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Admin login successful
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
 *                   example: "Admin login successful"
 *                 token:
 *                   type: string
 *                   description: JWT token for admin (expires in 7 days)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 admin:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: "admin"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username and password are required"
 *       401:
 *         description: Invalid admin credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid admin credentials"
 *       500:
 *         description: Internal server error
 */
router.post("/admin-login", loginAdmin);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Generate a new JWT token using an existing valid token. The new token will have the same user information and a new expiration time (7 days from refresh).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: "Token refreshed successfully"
 *                 token:
 *                   type: string
 *                   description: New JWT token (expires in 7 days)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: No token provided or invalid/expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No token provided" or "Invalid or expired token"
 *       500:
 *         description: Internal server error
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/home:
 *   get:
 *     summary: Get user dashboard information
 *     description: Retrieve user information from a valid JWT token. This endpoint validates the token and returns the user's registration number and role.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome message with user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Welcome to your dashboard"
 *                 user:
 *                   type: object
 *                   properties:
 *                     regnumber:
 *                       type: string
 *                       example: "EZ/CSC1001/2025" or "ADMIN"
 *                     role:
 *                       type: string
 *                       enum: [admin, voter]
 *                       example: "voter"
 *       401:
 *         description: No token provided or invalid/expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No token provided" or "Invalid or expired token"
 *       500:
 *         description: Internal server error
 */
router.get("/home", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as {
      regnumber?: string;
      username?: string;
      role?: string;
    };
    return res.json({
      message: "Welcome to your dashboard",
      user: {
        regnumber: decoded.regnumber || decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;

