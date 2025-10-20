import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/** 🔐 Protect middleware — verifies JWT for authenticated users */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No Authorization header found");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // 🧪 Local admin bypass for dev/testing
  if (token === "local-admin-token") {
    console.log("🧪 Local admin bypass activated");
    req.user = { regnumber: "ADMIN", role: "admin", devBypass: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("🔍 Decoded JWT:", decoded);

    const regnumber = (decoded.regnumber || decoded.username || decoded.email)?.toUpperCase();
    if (!regnumber) {
      console.warn("⚠️ Missing regnumber in decoded token:", decoded);
      return res.status(401).json({ message: "Invalid token payload (no regnumber)" });
    }

    req.user = {
      regnumber,
      role: decoded.role || "voter",
      isDemo: decoded.isDemo || false,
    };

    console.log(`✅ Authenticated as ${req.user.regnumber} (${req.user.role})`);
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/** ⚖️ Allows only voters */
export const voterOnly = (req, res, next) => {
  if (!req.user?.regnumber || req.user.role !== "voter") {
    console.warn(`⚠️ Access denied: Role '${req.user?.role || "none"}' is not voter`);
    return res.status(403).json({ message: "Access denied. Voters only." });
  }
  next();
};

/** ⚖️ Allows only admins */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    console.warn("⚠️ Access denied: Admins only");
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
