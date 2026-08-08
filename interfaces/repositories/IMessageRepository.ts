import { IMessage } from "../../types/chat.types";

export interface IMessageRepository {
  createBookingCardMessage(data: {
    conversationId: string;
    bookingId: string;
    senderId: string;
    senderRole: "user" | "provider";
  }): Promise<IMessage>;
  findLastByConversationId(conversationId: string): Promise<IMessage | null>;
  countUnread(conversationId: string, userId: string): Promise<number>;
  findByConversationId(conversationId: string): Promise<IMessage[]>;
  createTextMessage(data: {
    conversationId: string;
    bookingId?: string | null;
    senderId: string;
    senderRole: "user" | "provider";
    content: string;
  }): Promise<IMessage>;
  createImageMessage(data: {
    conversationId: string;
    bookingId?: string | null;
    senderId: string;
    senderRole: "user" | "provider";
    imageUrl: string;
    imagePublicId: string;
  }): Promise<IMessage>;
  markReadByConversation(conversationId: string, userId: string): Promise<void>;
  markDeliveredForUserInConversations(conversationIds: string[], userId: string): Promise<void>;
  findUndeliveredConversationIds(userId: string, conversationIds: string[]): Promise<string[]>;
  softDeleteMessage(messageId: string, userId: string): Promise<IMessage | null>;
  findById(messageId: string): Promise<IMessage | null>;
  updateById(messageId: string, data: Partial<IMessage>): Promise<IMessage | null>;
  deleteByConversationId(conversationId: string): Promise<void>;
}
