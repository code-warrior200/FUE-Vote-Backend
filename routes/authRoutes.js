import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const router = express.Router();

// ✅ Temporary in-memory user for example
const user = { id: 1, username: "admin", password: "admin123", studentId: "12345" };

// ✅ Allow frontend access (important fix for strict-origin-when-cross-origin)
router.use(
  cors({
    origin: "*", // You can restrict this to your frontend domain later
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Parse JSON request body
router.use(express.json());

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate the user and return a JWT token.
 */
router.post("/login", (req, res) => {
  const { username, password, studentId } = req.body;

  // 🔸 Support both username/password and studentId-based login
  const isValidByUsername =
    username === user.username && password === user.password;

  const isValidByStudentId = studentId && studentId === user.studentId;

  if (!isValidByUsername && !isValidByStudentId) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // ✅ Sign JWT using secret from environment or fallback
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, studentId: user.studentId },
  });
});

/**
 * @swagger
 * /api/auth/dashboard:
 *   get:
 *     summary: Protected dashboard route
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    console.log("✅ Authenticated user:", decoded);
    return res.json({ users: 100, votes: 250, admin: decoded.username });
  } catch (error) {
    console.error("JWT error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
