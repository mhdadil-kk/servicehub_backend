import { IMessage, IConversation, IPopulatedParticipant } from "../../types/chat.types";
import { MessageResponseDTO } from "../../dtos/chat.dto";

export interface ConversationListItem {
  _id: string;
  participants: IPopulatedParticipant[];
  bookingId?: string | null;
  lastMessage?: IMessage | null;
  unreadCount: number;
  providerServiceName: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface IChatService {
  getConversations(userId: string): Promise<ConversationListItem[]>;
  getOrCreateDirectConversation(userId: string, targetUserId: string): Promise<IConversation & { providerServiceName?: string }>;
  getChatHistory(conversationIdOrBookingId: string, userId: string): Promise<MessageResponseDTO[]>;
  saveMessage(
    conversationIdOrBookingId: string,
    senderId: string,
    senderRole: "user" | "provider",
    content: string
  ): Promise<MessageResponseDTO>;
  saveImageMessage(
    conversationId: string,
    senderId: string,
    senderRole: "user" | "provider",
    imageUrl: string,
    imagePublicId: string
  ): Promise<MessageResponseDTO>;
  markAsRead(conversationIdOrBookingId: string, userId: string): Promise<void>;
  markAsDelivered(userId: string): Promise<string[]>;
  markMessageDelivered(messageId: string): Promise<void>;
  deleteConversation(conversationId: string, userId: string): Promise<void>;
  deleteMessage(messageId: string, userId: string): Promise<MessageResponseDTO>;
}
