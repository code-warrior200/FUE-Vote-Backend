import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "../config/db.js";
import { swaggerUi, swaggerSpec } from "../config/swaggar.js";

// Routes
import categoryRoutes from "../routes/categoryRoutes.js";
import candidateRoutes from "../routes/candidateRoute.js";
import adminRoutes from "../routes/adminRoutes.js";
import adminRoute from "../routes/adminRoute.js";
import voteRoutes from "../routes/voteRoute.js";
import authRoutes from "../routes/authRoutes.js";



// Middleware
import { errorHandler } from "../middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);

// ✅ 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Global error handler (must be after routes)
app.use(errorHandler);

// ✅ Create HTTP server & Socket.IO
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

// ✅ Dynamic PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
