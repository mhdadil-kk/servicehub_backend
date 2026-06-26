import { IConversation } from "../../models/conversation.model";

export interface IConversationRepository {
  findByParticipants(participantIds: string[]): Promise<IConversation | null>;
  createForBooking(participantIds: string[], bookingId: string): Promise<IConversation>;
  attachBooking(conversationId: string, bookingId: string): Promise<IConversation | null>;
  findByUserIdPopulated(userId: string): Promise<IConversation[]>;
  findDirectBetweenUsers(userId: string, targetUserId: string): Promise<IConversation[]>;
  createDirect(participantIds: string[]): Promise<IConversation>;
  findByIdOrBookingIdPopulated(id: string): Promise<IConversation | null>;
  findById(id: string): Promise<IConversation | null>;
  touchUpdatedAt(conversationId: string): Promise<void>;
  deleteById(conversationId: string): Promise<boolean>;
  isParticipant(conversation: IConversation, userId: string): boolean;
}
