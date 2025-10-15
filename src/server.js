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
import voteRoutes from "../routes/voteRoute.js";
import authRoutes from "../routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Swagger setup (works locally & on Render)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true, // enables "Explore" button in Swagger UI
}));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);

// ✅ Create HTTP server & Socket.IO setup
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Dynamic PORT for Render deployment
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs available at: http://localhost:${PORT}/api-docs`);
});
