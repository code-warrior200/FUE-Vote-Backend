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

// Default admin credentials
const defaultAdmin = {
  username: "admin",
  password: "admin123", // You can change this
  role: "admin",
  id: 0
};

const TOKEN_EXPIRATION = "7d"; // 7 days
const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

// Generate JWT with role
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, regnumber: user.regnumber || user.username, role: user.role },
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
    role: "voter",
  };

  const token = generateToken(voter);

  return res.json({
    message: "Login successful",
    token,
    voter,
  });
});

// Admin login
router.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (username === defaultAdmin.username && password === defaultAdmin.password) {
    const token = generateToken(defaultAdmin);
    return res.json({
      message: "Admin login successful",
      token,
      admin: { username: defaultAdmin.username, role: defaultAdmin.role },
    });
  } else {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
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
      user: { regnumber: decoded.regnumber || decoded.username, role: decoded.role },
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

    const newToken = generateToken({
      id: decoded.id,
      regnumber: decoded.regnumber || decoded.username,
      role: decoded.role,
      username: decoded.username
    });

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
      user: { id: decoded.id, regnumber: decoded.regnumber || decoded.username, role: decoded.role },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
