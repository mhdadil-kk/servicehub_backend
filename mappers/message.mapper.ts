import { IMessage } from "../types/chat.types";
import { MessageResponseDTO } from "../dtos/chat.dto";

export class MessageMapper {
  static toResponse(message: IMessage & { toObject?: () => IMessage }): MessageResponseDTO | null {
    if (!message) return null;

    const m = typeof message.toObject === 'function' ? message.toObject() : message;

    return {
      _id: m._id?.toString() || m.id || '',
      conversationId: m.conversationId ? m.conversationId.toString() : '',
      senderId: m.senderId ? m.senderId.toString() : '',
      senderRole: m.senderRole,
      messageType: m.messageType || 'text',
      content: m.content || '',
      imageUrl: m.imageUrl,
      imagePublicId: m.imagePublicId,
      bookingId: m.bookingId ? m.bookingId.toString() : undefined,
      status: (m.read ? "read" : m.delivered ? "delivered" : "sent") as "sent" | "delivered" | "read",
      createdAt: new Date(m.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(m.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(messages: (IMessage & { toObject?: () => IMessage })[]): MessageResponseDTO[] {
    return messages.map(m => this.toResponse(m)!);
  }
}
