import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";
const TOKEN_EXPIRY = "12h";

/** 🔐 Generate JWT for a user */
const generateToken = ({ _id, regnumber, role }) =>
  jwt.sign(
    { id: _id, regnumber, role: role || "voter" },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );

/** Utility: Format user object for responses */
const formatUser = (user) => ({
  _id: user._id,
  regnumber: user.regnumber,
  role: user.role,
  name: user.name,
});

/**
 * ✅ Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { regnumber, password } = req.body;

  if (!regnumber || !password) {
    return res.status(400).json({ message: "Reg number and password required" });
  }

  const user = await User.findOne({ regnumber });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: formatUser(user),
  });
});

/**
 * ✅ Refresh JWT
 * @route POST /api/auth/refresh
 * @access Public (with token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const oldToken = req.headers.authorization?.split(" ")[1];
  if (!oldToken) return res.status(401).json({ message: "No token provided" });

  let decoded;
  try {
    decoded = jwt.verify(oldToken, SECRET_KEY);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const newToken = generateToken(decoded);
  res.status(200).json({ token: newToken });
});
