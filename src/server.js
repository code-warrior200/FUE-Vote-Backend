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

// ✅ Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);

// Create HTTP server & Socket.IO
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Admin/Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// API Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}\n📘 Swagger Docs: http://localhost:${PORT}/api-docs`)
);
