import { IMessage } from "../types/chat.types";

export interface MessageResponseDTO {
  _id: string;
  conversationId: string;
  bookingId?: string;
  senderId: string;
  senderRole: string;
  messageType: string;
  content: string;
  read: boolean;
  delivered: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export class MessageMapper {
  static toResponse(message: IMessage | any): MessageResponseDTO | null {
    if (!message) return null;

    const m = typeof message.toObject === 'function' ? message.toObject() : message;

    return {
      _id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      bookingId: m.bookingId?.toString(),
      senderId: m.senderId.toString(),
      senderRole: m.senderRole,
      messageType: m.messageType,
      content: m.content,
      read: m.read,
      delivered: m.delivered,
      isDeleted: m.isDeleted ?? false,
      createdAt: new Date(m.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(m.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(messages: any[]): MessageResponseDTO[] {
    return messages.map(msg => this.toResponse(msg)!);
  }
}
