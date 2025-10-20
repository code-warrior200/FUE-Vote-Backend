import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * 🔒 Protect middleware — verifies JWT for authenticated users
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Optional: local admin bypass for dev
    if (token === "local-admin-token") {
      req.user = {
        _id: "local-admin",
        username: "admin",
        role: "admin",
        devBypass: true,
      };
      return next();
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    // ✅ Use _id (matches your Mongoose schema)
    req.user = {
      _id: decoded.id, // use _id to align with controller expectations
      regnumber: decoded.regnumber,
      role: decoded.role || "voter",
    };

    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * 👥 Only voters allowed
 */
export const voterOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Access denied. Voters only." });
  }

  if (req.user.role !== "voter" && !req.user.devBypass) {
    return res.status(403).json({ message: "Access denied. Voters only." });
  }

  next();
};

/**
 * 👑 Only admins allowed
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
