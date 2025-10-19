import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * ✅ Protect middleware — verifies JWT or allows local admin bypass
 */
export const protect = async (req, res, next) => {
  let token;

  try {
    const authHeader = req.headers.authorization;
    console.log("🔐 Authorization Header:", authHeader); // ✅ Log for debugging

    // ✅ 1. Check if token exists
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1]; // works with or without trailing space
    } else {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // ✅ 2. Allow local admin bypass before JWT verification
    if (token === "local-admin-token") {
      req.user = {
        _id: "local-admin",
        username: "admin",
        role: "admin",
        devBypass: true,
      };
      return next();
    }

    // ✅ 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ 4. Find user in DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ 5. Optional single-session protection
    if (user.activeToken && user.activeToken !== token) {
      return res.status(401).json({
        message: "You have been logged out from another device. Please log in again.",
      });
    }

    // ✅ 6. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }

    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

/**
 * ✅ Admin-only middleware
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Access denied. Admins only." });
};

/**
 * ✅ Voter-only middleware
 */
export const voterOnly = (req, res, next) => {
  if (req.user && req.user.role === "voter") return next();
  return res.status(403).json({ message: "Access denied. Voters only." });
};
