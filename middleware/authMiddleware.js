import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ✅ Verify JWT and enforce single active session
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Prevent duplicate login: check if token matches active session
      if (user.activeToken !== token) {
        return res.status(401).json({
          message: "You have been logged out from another device. Please log in again.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// ✅ Admin-only routes
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Access denied. Admins only." });
};

// ✅ Voter-only routes
export const voterOnly = (req, res, next) => {
  if (req.user && req.user.role === "voter") return next();
  return res.status(403).json({ message: "Access denied. Voters only." });
};
