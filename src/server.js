import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "../config/db.js";
import { swaggerUi, swaggerSpec } from "../config/swaggar.js";

// Routes
import authRoutes from "../routes/authRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import candidateRoutes from "../routes/candidateRoute.js";
import adminRoutes from "../routes/adminRoutes.js"; // Unified admin routes
import voteRoutes from "../routes/voteRoute.js";

// Middleware
import { errorHandler } from "../middleware/errorMiddleware.js";

// ======= CONFIG =======
dotenv.config();
connectDB();

const app = express();

// ======= MIDDLEWARES =======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======= SWAGGER =======
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ======= HTTP SERVER & SOCKET.IO =======
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  },
});

// Attach io instance to each request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ======= API ROUTES =======
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);

// ======= 404 HANDLER =======
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ======= GLOBAL ERROR HANDLER =======
app.use(errorHandler);

// ======= SOCKET.IO EVENTS =======
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

// ======= START SERVER =======
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
