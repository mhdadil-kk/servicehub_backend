import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { IChatService } from "../interfaces/services/IChatService";

const onlineUsers = new Set<string>();

export const setupChatSocket = (io: Server, chatService: IChatService) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const secret = process.env.ACCESS_TOKEN_SECRET || "default_jwt_secret";
      const decoded = jwt.verify(token as string, secret) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const user = socket.data.user;

    onlineUsers.add(user.id);
    socket.broadcast.emit("user_online", { userId: user.id });

    socket.emit("online_users", { userIds: Array.from(onlineUsers) });

    try {
      const deliveredConvIds = await chatService.markAsDelivered(user.id);
      deliveredConvIds.forEach((convId: string) => {
        const roomName = `conversation_${convId}`;
        socket.to(roomName).emit("messages_delivered", { conversationId: convId });
      });
    } catch (err) {
      console.error("Error marking messages as delivered:", err);
    }

    socket.on("join_room", async (id: string) => {
      try {
        await chatService.markAsRead(id, user.id);


        const roomName = `conversation_${id}`;
        socket.join(roomName);

        socket.to(roomName).emit("messages_read", { conversationId: id });
      } catch (err) {
        console.error("Error on join_room:", err);
      }
    });

    socket.on(
      "send_message",
      async (data: { conversationId?: string; bookingId?: string; content: string }) => {
        const { conversationId, bookingId, content } = data;
        const id = conversationId || bookingId;
        if (!id || !content?.trim()) return;

        try {
          const message = await chatService.saveMessage(id, user.id, user.role, content);

          const convId = message.conversationId.toString();
   
          const roomName = `conversation_${convId}`;
          const socketsInRoom = await io.in(roomName).fetchSockets();
          const recipientOnline = socketsInRoom.some(
            (s) => s.data.user?.id !== user.id
          );

          if (recipientOnline) {
            await chatService.markMessageDelivered(message._id.toString());
            (message as any).delivered = true;
          }

          io.to(roomName).emit("message_received", message);
        } catch (err) {
          console.error("Error saving message:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("delete_message", async (data: { messageId: string }) => {
      const { messageId } = data;
      if (!messageId) return;

      try {
        const message = await chatService.deleteMessage(messageId, user.id);
        const roomName = `conversation_${message.conversationId}`;
        io.to(roomName).emit("message_deleted", message);
      } catch (err) {
        console.error("Error deleting message:", err);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("mark_read", async (id: string) => {
      try {
        await chatService.markAsRead(id, user.id);
        const roomName = `conversation_${id}`;
        socket.to(roomName).emit("messages_read", { conversationId: id });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(user.id);
      io.emit("user_offline", { userId: user.id });
    });
  });
};
