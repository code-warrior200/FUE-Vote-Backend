import express, { type Request, type Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import {
  loginUser,
  loginVoter,
  loginAdmin,
  refreshToken,
} from "../controllers/authController";

const router = express.Router();

router.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
router.use(express.json());

router.post("/login", loginUser);
router.post("/voter-login", loginVoter);
router.post("/admin-login", loginAdmin);
router.post("/refresh", refreshToken);

router.get("/home", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as {
      regnumber?: string;
      username?: string;
      role?: string;
    };
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

