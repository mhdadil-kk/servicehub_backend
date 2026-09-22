import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db";
import app from "./app";
import { logger } from "./utils/logger";
import { setupChatSocket } from "./socket/chat.socket";
import { chatService } from "./di/container";

connectDB();

const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  }
});

setupChatSocket(io, chatService);

server.listen(PORT, () => {
  logger.info(`✅ Server is running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err: unknown) => {
  logger.error("UNHANDLED REJECTION!  Shutting down...", err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
});