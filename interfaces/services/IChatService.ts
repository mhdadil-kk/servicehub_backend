import { IMessage } from "../../types/chat.types";

export interface ConversationListItem {
  _id: string;
  participants: any[];
  bookingId?: any;
  lastMessage?: IMessage | null;
  unreadCount: number;
  providerServiceName: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface IChatService {
  getConversations(userId: string): Promise<ConversationListItem[]>;
  getOrCreateDirectConversation(userId: string, targetUserId: string): Promise<any>;
  getChatHistory(conversationIdOrBookingId: string, userId: string): Promise<IMessage[]>;
  saveMessage(
    conversationIdOrBookingId: string,
    senderId: string,
    senderRole: "user" | "provider",
    content: string
  ): Promise<IMessage>;
  markAsRead(conversationIdOrBookingId: string, userId: string): Promise<void>;
  markAsDelivered(userId: string): Promise<string[]>;
  markMessageDelivered(messageId: string): Promise<void>;
  deleteConversation(conversationId: string, userId: string): Promise<void>;
  deleteMessage(messageId: string, userId: string): Promise<IMessage>;
}
