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

    // ✅ Find by either matric number or email
    const user = await User.findOne({
      $or: [{ matricNo: matricOrEmail }, { email: matricOrEmail }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // ✅ Generate JWT
    const token = generateToken(user._id);

    // ✅ Optional: Store token in DB for single-session control
    user.activeToken = token;
    await user.save();

    // ✅ Send response to frontend
    res.status(200).json({
      message: "Login successful",
      jwt_token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matricNo: user.matricNo,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logs the user out by clearing active token
 * @access  Private
 */
export const logoutUser = async (req, res) => {
  try {
    if (!req.user) return res.status(400).json({ message: "User not authenticated." });

    req.user.activeToken = null;
    await req.user.save();

    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
