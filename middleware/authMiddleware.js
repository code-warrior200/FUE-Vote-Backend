import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * ✅ Protect middleware — verifies JWT for authenticated users
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("⚠️ No Authorization header found");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 🧪 Local admin bypass (for development/testing)
    if (token === "local-admin-token") {
      console.log("🧪 Local admin bypass activated");
      req.user = {
        regnumber: "admin",
        role: "admin",
        devBypass: true,
      };
      return next();
    }

    // ✅ Verify and decode token
    const decoded = jwt.verify(token, SECRET_KEY);

    // 🪵 Debug: show payload
    console.log("🔍 Decoded JWT:", decoded);

    // ✅ Fallback support (old tokens or missing regnumber)
    const regnumber =
      decoded.regnumber ||
      decoded.username || // older schema
      decoded.email || // fallback
      null;

    if (!regnumber) {
      console.warn("⚠️ Missing regnumber in decoded token:", decoded);
      return res.status(401).json({ message: "Invalid token payload (no regnumber)" });
    }

    req.user = {
      regnumber,
      role: decoded.role || "voter",
    };

    console.log(`✅ Authenticated as ${req.user.regnumber} (${req.user.role})`);
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
  if (!req.user || !req.user.regnumber) {
    console.warn("⚠️ Access denied: Missing regnumber");
    return res.status(401).json({ message: "Access denied. Voters only." });
  }

  if (req.user.role !== "voter") {
    console.warn(`⚠️ Access denied: Role '${req.user.role}' is not voter`);
    return res.status(403).json({ message: "Access denied. Voters only." });
  }

  next();
};

/**
 * ✅ Allows only admins to access
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.warn("⚠️ Access denied: Admins only");
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
