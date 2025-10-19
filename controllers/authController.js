import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

/**
 * @desc    Generate JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token valid for 7 days
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { matricOrEmail, password } = req.body;

    if (!matricOrEmail || !password) {
      return res.status(400).json({ message: "Please enter all fields." });
    }

    // ✅ Find by matric number or email
    const user = await User.findOne({
      $or: [{ matricNo: matricOrEmail }, { email: matricOrEmail }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // ✅ Generate JWT
    const token = generateToken(user._id);

    // ✅ Save token in DB for session tracking
    user.activeToken = token;
    await user.save();

    // ✅ Return consistent token key name: "token"
    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // ✅ standardized key
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matricNo: user.matricNo,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logs out user by clearing active token
 * @access  Private
 */
export const logoutUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: "User not authenticated." });
    }

    req.user.activeToken = null;
    await req.user.save();

    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("❌ Logout error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
export const verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.activeToken && user.activeToken !== token) {
      return res.status(401).json({ message: "Session invalidated. Please log in again." });
    }

    res.status(200).json({ valid: true, user });
  } catch (err) {
    console.error("❌ Token verify error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
