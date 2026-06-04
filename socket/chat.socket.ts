import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatService } from "../services/chat.service";
import Conversation from "../models/conversation.model";

const chatService = new ChatService();

export const setupChatSocket = (io: Server) => {
  // Middleware to authenticate socket connections via JWT
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

  // In-memory store of currently connected user IDs
  const onlineUsers = new Set<string>();

  io.on("connection", async (socket: Socket) => {
    const user = socket.data.user;

    // Mark user as online and broadcast to all others
    onlineUsers.add(user.id);
    socket.broadcast.emit("user_online", { userId: user.id });

    // Send the current online list to the newly connected socket
    socket.emit("online_users", { userIds: Array.from(onlineUsers) });

    // When user connects, mark messages sent to them as delivered
    try {
      const deliveredConvIds = await chatService.markAsDelivered(user.id);
      deliveredConvIds.forEach(convId => {
        const roomName = `conversation_${convId}`;
        socket.to(roomName).emit("messages_delivered", { conversationId: convId });
      });
    } catch (err) {
      console.error("Error marking messages as delivered:", err);
    }

    // Join booking/conversation chat room
    socket.on("join_room", async (id: string) => {
      try {
        let conversation = await Conversation.findOne({
          $or: [
            { _id: id },
            { bookingId: id }
          ]
        });

        if (!conversation) return;

        const roomName = `conversation_${conversation._id}`;
        socket.join(roomName);

        await chatService.markAsRead(conversation._id.toString(), user.id);
        socket.to(roomName).emit("messages_read", { conversationId: conversation._id });
      } catch (err) {
        console.error("Error marking messages as read on join:", err);
      }
    });

    // Handle sending a new message
    socket.on("send_message", async (data: { conversationId?: string; bookingId?: string; content: string }) => {
      const { conversationId, bookingId, content } = data;
      const id = conversationId || bookingId;
      if (!id || !content.trim()) return;

      try {
        const message = await chatService.saveMessage(id, user.id, user.role, content);
        
        // Check if recipient is online to mark as delivered instantly
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
          const recipientId = conversation.participants.find(p => p.toString() !== user.id)?.toString();
          if (recipientId && onlineUsers.has(recipientId)) {
            message.delivered = true;
            await message.save();
          }
        }

        const roomName = `conversation_${message.conversationId}`;
        io.to(roomName).emit("message_received", message);
      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle deleting a message
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

    // Handle read receipt trigger
    socket.on("mark_read", async (id: string) => {
      try {
        let conversation = await Conversation.findOne({
          $or: [
            { _id: id },
            { bookingId: id }
          ]
        });

        if (!conversation) return;

        const roomName = `conversation_${conversation._id}`;
        await chatService.markAsRead(conversation._id.toString(), user.id);
        socket.to(roomName).emit("messages_read", { conversationId: conversation._id });
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
