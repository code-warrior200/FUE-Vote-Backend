import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";

import connectDB from "./config/db";
import { swaggerUi, swaggerSpec } from "./config/swagger";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import candidateRoutes from "./routes/candidateRoute";
import adminRoutes from "./routes/adminRoutes";
import voteRoutes from "./routes/voteRoute";

import { errorHandler } from "./middleware/errorMiddleware";

dotenv.config();

connectDB().catch((error) => {
  console.error("❌ Failed to connect to MongoDB:", error);
  process.exit(1);
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  },
});

app.set("io", io);

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

io.on("connection", (socket: Socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});

export default app;


