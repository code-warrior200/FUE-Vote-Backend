import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * ✅ Protect middleware — verifies JWT for authenticated users
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
    // JWT token directly includes regnumber
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      regnumber: decoded.regnumber,
      role: decoded.role || "voter",
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

    // 🧪 Optional: Local development bypass for admin testing
    if (token === "local-admin-token") {
      req.user = {
        _id: "local-admin",
        username: "admin",
        role: "admin",
        devBypass: true,
      };
      return next();
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, SECRET_KEY);

    // ⚙️ Standardize field names to always include "_id"
    req.user = {
      _id: decoded.id || decoded._id, // Always ensure this exists
      id: decoded.id || decoded._id, // (kept for backward compatibility)
      regnumber: decoded.regnumber,
      role: decoded.role || "voter",
    };

    if (!req.user._id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * ✅ Allows only voters to access
 */
export const voterOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Access denied. Voters only." });
  }

  if (req.user.role && req.user.role !== "voter") {
    return res.status(403).json({ message: "Access denied. Voters only." });
  }

  next();
};

/**
 * ✅ Allows only admins to access
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
