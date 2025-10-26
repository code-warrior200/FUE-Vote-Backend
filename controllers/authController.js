import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";
const TOKEN_EXPIRY = "7d";

/** 🔐 Generate JWT for a user or voter */
const generateToken = ({ id, regnumber, username, role }) =>
  jwt.sign(
    { id, regnumber, username, role: role || "voter" },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );

/** Utility: Format user object for frontend responses */
const formatUser = (user) => ({
  _id: user._id,
  regnumber: user.regnumber,
  role: user.role,
  name: user.name,
});

/**
 * ✅ Database user login (admin/staff)
 * @route POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { regnumber, password } = req.body;

  if (!regnumber || !password)
    return res.status(400).json({ message: "Reg number and password required" });

  const user = await User.findOne({ regnumber });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken({
    id: user._id,
    regnumber: user.regnumber,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: formatUser(user),
  });
});

/**
 * ✅ Default voter login (no password)
 * @route POST /api/auth/voter-login
 */
export const loginVoter = asyncHandler(async (req, res) => {
  const { regnumber } = req.body;

  if (!regnumber)
    return res.status(400).json({ message: "Registration number is required" });

  // Define allowed test voters
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

  // Validate format
  const regPattern = /^EZ\/[A-Z]{3}\d{4}\/2025$/i;
  if (!regPattern.test(regnumber))
    return res.status(401).json({ message: "Invalid registration number format" });

  const index = defaultVoters.findIndex(
    (v) => v.toUpperCase() === regnumber.toUpperCase()
  );

  if (index === -1)
    return res.status(401).json({ message: "Registration number not found" });

  const voter = {
    id: index + 1,
    regnumber: regnumber.toUpperCase(),
    role: "voter",
  };

  const token = generateToken(voter);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    voter,
  });
});

/**
 * ✅ Admin quick login (default credentials)
 * @route POST /api/auth/admin-login
 */
export const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const defaultAdmin = {
    username: "admin",
    password: "admin123",
    role: "admin",
    id: 0,
  };

  if (!username || !password)
    return res.status(400).json({ message: "Username and password are required" });

  if (
    username !== defaultAdmin.username ||
    password !== defaultAdmin.password
  ) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = generateToken(defaultAdmin);

  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token,
    admin: { username, role: "admin" },
  });
});

/**
 * ✅ Refresh JWT
 * @route POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const oldToken = req.headers.authorization?.split(" ")[1];
  if (!oldToken) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(oldToken, SECRET_KEY);
    const newToken = generateToken({
      id: decoded.id,
      regnumber: decoded.regnumber,
      username: decoded.username,
      role: decoded.role,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});
