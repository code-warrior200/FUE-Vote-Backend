import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * ✅ Middleware to verify JWT or allow the default local admin token (for dev)
 */
export const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // ✅ Allow the local default admin bypass (for testing)
      if (token === "local-admin-token") {
        req.user = {
          _id: "local-admin",
          username: "admin",
          role: "admin",
          devBypass: true,
        };
        return next();
      }

      // ✅ Verify real JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Enforce single active session
      if (user.activeToken !== token) {
        return res.status(401).json({
          message:
            "You have been logged out from another device. Please log in again.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }
};

/**
 * ✅ Admin-only route protection
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Access denied. Admins only." });
};

/**
 * ✅ Voter-only route protection
 */
export const voterOnly = (req, res, next) => {
  if (req.user && req.user.role === "voter") return next();
  return res.status(403).json({ message: "Access denied. Voters only." });
};
