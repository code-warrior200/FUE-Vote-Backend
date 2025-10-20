import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * ✅ Protect middleware — verifies JWT for authenticated users
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // Optional: local admin bypass
  if (token === "local-admin-token") {
    req.user = {
      id: "local-admin",
      username: "admin",
      role: "admin",
      devBypass: true,
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = { id: decoded.id, regnumber: decoded.regnumber, role: "voter" }; // default role voter
    next();
  } catch (err) {
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

  // Optional: if using roles
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
