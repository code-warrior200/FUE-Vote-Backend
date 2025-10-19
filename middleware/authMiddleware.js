import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * ✅ Protect middleware — verifies JWT or allows local admin bypass
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // ✅ Local admin bypass (for development/testing only)
      if (token === "local-admin-token") {
        req.user = {
          _id: "local-admin",
          username: "admin",
          role: "admin",
          devBypass: true,
        };
        return next();
      }

      // ✅ Verify JWT using secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Optional: only enforce activeToken check if it exists
      if (user.activeToken && user.activeToken !== token) {
        return res.status(401).json({
          message:
            "You have been logged out from another device. Please log in again.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("❌ JWT verification error:", error.message);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired. Please log in again." });
      }

      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided" });
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
