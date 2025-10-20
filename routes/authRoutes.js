import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const router = express.Router();

// CORS
router.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// JSON body
router.use(express.json());

// Default voters
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

const TOKEN_EXPIRATION = "7d"; // 7 days
const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

// Generate JWT with role
const generateToken = (voter) => {
  return jwt.sign(
    { id: voter.id, regnumber: voter.regnumber, role: voter.role },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRATION }
  );
};

// Voter login
router.post("/voter-login", (req, res) => {
  const { regnumber } = req.body;

  if (!regnumber) {
    return res.status(400).json({ message: "Registration number is required" });
  }

  const regPattern = /^EZ\/[A-Z]{3}\d{4}\/2025$/i;
  if (!regPattern.test(regnumber)) {
    return res.status(401).json({ message: "Invalid registration number format" });
  }

  const index = defaultVoters.findIndex(v => v.toUpperCase() === regnumber.toUpperCase());
  if (index === -1) {
    return res.status(401).json({ message: "Registration number not found" });
  }

  const voter = {
    id: index + 1,
    regnumber: regnumber.toUpperCase(),
    role: "voter", // important!
  };

  const token = generateToken(voter);

  return res.json({
    message: "Login successful",
    token,
    voter,
  });
});

// Protected dashboard
router.get("/home", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return res.json({
      message: "Welcome to your dashboard",
      voter: { regnumber: decoded.regnumber },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Refresh token
router.post("/refresh", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // Re-generate token with role intact
    const newToken = generateToken({
      id: decoded.id,
      regnumber: decoded.regnumber,
      role: decoded.role,
    });

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
      voter: { id: decoded.id, regnumber: decoded.regnumber, role: decoded.role },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
