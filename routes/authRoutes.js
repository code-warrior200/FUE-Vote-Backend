import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const router = express.Router();

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
 */
router.post("/voter-login", (req, res) => {
  const { regnumber } = req.body;

  if (!regnumber) {
    return res.status(400).json({ message: "Registration number is required" });
  }

  // ✅ Match valid pattern like "EZ/CSC2314/2025" or "EZ/MTH1020/2025"
  const regPattern = /^EZ\/[A-Z]{3}\d{4}\/2025$/i;

  if (!regPattern.test(regnumber)) {
    return res.status(401).json({ message: "Invalid registration number format" });
  }

  // ✅ Dynamic voter object
  const voter = {
    id: Math.floor(Math.random() * 100000),
    regnumber,
  };

  // ✅ Generate JWT token
  const token = jwt.sign(
    { id: voter.id, regnumber: voter.regnumber },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "3h" }
  );

  return res.json({
    message: "Login successful",
    token,
    voter,
  });
});

/**
 * @swagger
 * /auth/home:
 *   get:
 *     summary: Get voter dashboard (protected route)
 *     description: Returns basic voter information. Requires a valid JWT in the `Authorization` header.
 *     tags: [VoterAuth]
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
