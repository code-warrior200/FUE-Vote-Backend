import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";               // Needed for Socket.IO
import { Server } from "socket.io";    // Import Socket.IO
import connectDB from "../config/db.js"; // ✅ fixed path

// Import Routes ✅ all paths consistent
import categoryRoutes from "../routes/categoryRoutes.js";
import candidateRoutes from "../routes/candidateRoute.js";
import adminRoutes from "../routes/adminRoutes.js";
import voteRoutes from "../routes/voteRoute.js";   // ✅ fixed typo
import authRoutes from "../routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server & bind Socket.IO
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*", // Change this to your frontend origin in production
    methods: ["GET", "POST"],
  },
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Admin/Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
