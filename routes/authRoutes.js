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

// ✅ Default voter list
const defaultVoters = [
  "EZ/CSC1001/2025",
  "EZ/CSC1002/2025",
  "EZ/MTH1003/2025",
  "EZ/BCH1004/2025",
  "EZ/ENG1005/2025",
  "EZ/PHY1006/2025",
  "EZ/BIO1007/2025",
  "EZ/STA1008/2025",
  "EZ/ECO1009/2025",
  "EZ/ACC1010/2025",
];

// ✅ Token config
const TOKEN_EXPIRATION = "7d"; // 7 days
const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

// ✅ Generate JWT token
const generateToken = (voter) => {
  return jwt.sign(
    { id: voter.id, regnumber: voter.regnumber },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRATION }
  );
};

// ✅ Middleware: verify token and attach voter
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.voter = { id: decoded.id, regnumber: decoded.regnumber };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * @route POST /auth/voter-login
 * @desc Login voter using registration number
 */
router.post("/voter-login", (req, res) => {
  const { regnumber } = req.body;

  if (!regnumber) {
    return res.status(400).json({ message: "Registration number is required" });
  }

  const regPattern = /^EZ\/[A-Z]{3}\d{4}\/2025$/i;
  if (!regPattern.test(regnumber)) {
    return res.status(401).json({ message: "Invalid registration number format" });
  }

  const index = defaultVoters.findIndex((v) => v.toUpperCase() === regnumber.toUpperCase());
  if (index === -1) {
    return res.status(401).json({ message: "Registration number not found" });
  }

  const voter = {
    id: index + 1,
    regnumber: regnumber.toUpperCase(),
    role: "voter",
  };

  const token = generateToken(voter);

  return res.json({
    success: true,
    message: "Login successful",
    token,
    voter,
  });
});

/**
 * @route GET /auth/home
 * @desc Protected route: get voter dashboard
 */
router.get("/home", verifyToken, (req, res) => {
  return res.json({
    success: true,
    message: "Welcome to your dashboard",
    voter: { regnumber: req.voter.regnumber },
  });
});

/**
 * @route POST /auth/refresh
 * @desc Refresh JWT token
 */
router.post("/refresh", verifyToken, (req, res) => {
  const voter = req.voter;
  const newToken = generateToken(voter);

  return res.json({
    success: true,
    message: "Token refreshed successfully",
    token: newToken,
    voter,
  });
});

export default router;
