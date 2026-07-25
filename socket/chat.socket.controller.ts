import { Server, Socket } from "socket.io";
import { IChatService } from "../interfaces/services/IChatService";

export class ChatSocketController {
  constructor(
    private _io: Server,
    private _chatService: IChatService,
    private _onlineUsers: Set<string>
  ) {}

  async handleConnection(socket: Socket) {
    const user = socket.data.user;
    if (!user) return;

    this._onlineUsers.add(user.id);
    socket.broadcast.emit("user_online", { userId: user.id });
    socket.emit("online_users", { userIds: Array.from(this._onlineUsers) });

    try {
      const deliveredConvIds = await this._chatService.markAsDelivered(user.id);
      deliveredConvIds.forEach((convId: string) => {
        const roomName = `conversation_${convId}`;
        socket.to(roomName).emit("messages_delivered", { conversationId: convId });
      });
    } catch (err) {
      socket.emit("error", { message: "Failed to mark messages as delivered" });
    }

    socket.on("join_room", async (id: string) => this.handleJoinRoom(socket, user.id, id));
    
    socket.on("send_message", async (data: { conversationId?: string; bookingId?: string; content: string }) => 
      this.handleSendMessage(socket, user, data)
    );

    socket.on("delete_message", async (data: { messageId: string }) => 
      this.handleDeleteMessage(socket, user.id, data)
    );

    socket.on("mark_read", async (id: string) => this.handleMarkRead(socket, user.id, id));

    socket.on("disconnect", () => this.handleDisconnect(user.id));
  }

  private async handleJoinRoom(socket: Socket, userId: string, roomId: string) {
    try {
      await this._chatService.markAsRead(roomId, userId);
      const roomName = `conversation_${roomId}`;
      socket.join(roomName);
      socket.to(roomName).emit("messages_read", { conversationId: roomId });
    } catch (err) {
      socket.emit("error", { message: "Failed to join room" });
    }
  }

  private async handleSendMessage(
    socket: Socket, 
    user: { id: string; role: string }, 
    data: { conversationId?: string; bookingId?: string; content: string }
  ) {
    const { conversationId, bookingId, content } = data;
    const id = conversationId || bookingId;
    
    if (!id || !content?.trim()) return;

    try {
      const message = await this._chatService.saveMessage(id, user.id, user.role as "user" | "provider", content);
      const convId = message.conversationId.toString();
      const roomName = `conversation_${convId}`;
      
      const socketsInRoom = await this._io.in(roomName).fetchSockets();
      const recipientOnline = socketsInRoom.some((s) => s.data.user?.id !== user.id);

      if (recipientOnline) {
        await this._chatService.markMessageDelivered(message._id.toString());
        (message as any).delivered = true;
      }

      this._io.to(roomName).emit("message_received", message);
    } catch (err) {
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  private async handleDeleteMessage(socket: Socket, userId: string, data: { messageId: string }) {
    const { messageId } = data;
    if (!messageId) return;

    try {
      const message = await this._chatService.deleteMessage(messageId, userId);
      const roomName = `conversation_${message.conversationId}`;
      this._io.to(roomName).emit("message_deleted", message);
    } catch (err) {
      socket.emit("error", { message: "Failed to delete message" });
    }
  }

  private async handleMarkRead(socket: Socket, userId: string, roomId: string) {
    try {
      await this._chatService.markAsRead(roomId, userId);
      const roomName = `conversation_${roomId}`;
      socket.to(roomName).emit("messages_read", { conversationId: roomId });
    } catch (err) {
      socket.emit("error", { message: "Failed to mark messages as read" });
    }
  }

  private handleDisconnect(userId: string) {
    this._onlineUsers.delete(userId);
    this._io.emit("user_offline", { userId });
  }
}
