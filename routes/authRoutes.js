import express from "express";
import cors from "cors";
import {
  loginUser,
  loginVoter,
  loginAdmin,
  refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

// Middleware
router.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
router.use(express.json());

/**
 * @desc User login (DB-based)
 * @route POST /api/auth/login
 */
router.post("/login", loginUser);

/**
 * @desc Default voter login (no password)
 * @route POST /api/auth/voter-login
 */
router.post("/voter-login", loginVoter);

/**
 * @desc Default admin login
 * @route POST /api/auth/admin-login
 */
router.post("/admin-login", loginAdmin);

/**
 * @desc Refresh JWT
 * @route POST /api/auth/refresh
 */
router.post("/refresh", refreshToken);

/**
 * @desc Protected test route (dashboard)
 * @route GET /api/auth/home
 */
router.get("/home", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return res.json({
      message: "Welcome to your dashboard",
      user: {
        regnumber: decoded.regnumber || decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
