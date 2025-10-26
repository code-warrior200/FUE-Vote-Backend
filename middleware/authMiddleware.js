import jwt from "jsonwebtoken";

// 🧠 Safe import of local voters (if defined)
let voters = [];
try {
  const controller = await import("../controllers/adminController.js");
  voters = controller.voters || [];
  console.log(`✅ Loaded ${voters.length} local in-memory voters.`);
} catch (err) {
  console.warn("⚠️ No local voters found in adminController.js — continuing without local mode.");
}

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * 🔐 Universal Auth Middleware
 * Supports:
 *  - Bearer JWT token (real voters & admins)
 *  - x-voter-id header (local/in-memory demo voters)
 *  - Local admin bypass (for development/testing)
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const localVoterId = req.headers["x-voter-id"];

  try {
    /** 🧪 1️⃣ Local voter (in-memory) */
    if (localVoterId) {
      const voter = voters.find(v => v.regnumber === localVoterId);
      if (!voter) {
        console.warn(`⚠️ Invalid local voter ID: ${localVoterId}`);
        return res.status(401).json({ message: "Invalid local voter ID." });
      }
      req.user = voter;
      console.log(`🧠 Authenticated as local voter: ${voter.regnumber}`);
      return next();
    }

    /** 🔑 2️⃣ JWT-based authentication */
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("⚠️ No Authorization header or Bearer token found");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    /** 🧪 3️⃣ Local admin bypass (for dev/testing) */
    if (token === "local-admin-token") {
      console.log("🧪 Local admin bypass activated");
      req.user = { regnumber: "ADMIN", role: "admin", devBypass: true };
      return next();
    }

    /** 🧩 4️⃣ Verify and decode JWT */
    const decoded = jwt.verify(token, SECRET_KEY);
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

    console.log(`✅ Authenticated via JWT: ${req.user.regnumber} (${req.user.role})`);
    next();
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
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
