import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

/**
 * 🔐 Universal Auth Middleware
 * Supports:
 *  - JWT-based authentication (voters/admins)
 *  - Local in-memory voters via `x-voter-id` header (optional)
 *  - Local admin bypass for development
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const localVoterId = req.headers["x-voter-id"];

  try {
    /** 🧠 1️⃣ Local voter (demo/in-memory mode) */
    if (localVoterId) {
      // Try loading local voters from adminController.js (if defined)
      let voters = [];
      try {
        const controller = await import("../controllers/adminController.js");
        voters = controller.voters || [];
      } catch {
        console.warn("⚠️ No local voters found — skipping local voter auth.");
      }

      const voter = voters.find(v => v.regnumber === localVoterId);
      if (!voter) {
        return res.status(401).json({ message: "Invalid local voter ID." });
      }

      req.user = {
        regnumber: voter.regnumber,
        role: "voter",
        isDemo: true,
      };

      console.log(`🧠 Authenticated as local voter: ${voter.regnumber}`);
      return next();
    }

    /** 🔑 2️⃣ JWT-based authentication */
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    /** 🧪 3️⃣ Local admin dev bypass */
    if (token === "local-admin-token") {
      console.log("🧪 Local admin bypass activated");
      req.user = { regnumber: "ADMIN", role: "admin", devBypass: true };
      return next();
    }

    /** 🧩 4️⃣ Verify and decode JWT */
    const decoded = jwt.verify(token, SECRET_KEY);
    const regnumber =
      (decoded.regnumber || decoded.username || decoded.email || "").toUpperCase();

    if (!regnumber) {
      return res.status(401).json({ message: "Invalid token payload (no regnumber)" });
    }

    req.user = {
      regnumber,
      role: decoded.role || "voter",
      id: decoded.id,
      isDemo: decoded.isDemo || false,
    };

    console.log(`✅ Authenticated via JWT: ${req.user.regnumber} (${req.user.role})`);
    next();
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * ⚖️ Restrict access to voters only
 */
export const voterOnly = (req, res, next) => {
  if (!req.user?.regnumber || req.user.role !== "voter") {
    console.warn(
      `⚠️ Access denied: '${req.user?.regnumber || "Unknown"}' is not a voter`
    );
    return res.status(403).json({ message: "Access denied. Voters only." });
  }
  next();
};

/**
 * ⚖️ Restrict access to admins only
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    console.warn("⚠️ Access denied: Admins only");
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
