import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * 🔐 Generate JWT for user
 * Always encodes `_id`, `regnumber`, and `role`
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id, // Always use _id here
      regnumber: user.regnumber,
      role: user.role || "voter",
    },
    SECRET_KEY,
    { expiresIn: "12h" } // adjust lifespan as needed
  );
};

/**
 * ✅ Login user (example)
 */
export const loginUser = async (req, res) => {
  try {
    const { regnumber, password } = req.body;

    if (!regnumber || !password) {
      return res.status(400).json({ message: "Reg number and password required" });
    }

    const user = await User.findOne({ regnumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        regnumber: user.regnumber,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Internal server error during login" });
  }
};

/**
 * ✅ (Optional) Token refresh endpoint
 */
export const refreshToken = async (req, res) => {
  try {
    const oldToken = req.headers.authorization?.split(" ")[1];
    if (!oldToken) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(oldToken, SECRET_KEY);

    // Reissue a new token with same info
    const newToken = generateToken(decoded);

    return res.status(200).json({ token: newToken });
  } catch (err) {
    console.error("❌ Token refresh error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
