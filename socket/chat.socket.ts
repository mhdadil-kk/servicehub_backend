import { Server, Socket } from "socket.io";
import { IChatService } from "../interfaces/services/IChatService";
import { socketAuthMiddleware } from "./socket.middleware";
import { ChatSocketController } from "./chat.socket.controller";

const onlineUsers = new Set<string>();

export const setupChatSocket = (io: Server, chatService: IChatService) => {
  io.use(socketAuthMiddleware);

  const chatController = new ChatSocketController(io, chatService, onlineUsers);

  io.on("connection", async (socket: Socket) => {
    await chatController.handleConnection(socket);
  });
};

