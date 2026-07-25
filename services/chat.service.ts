import { IConversationRepository } from "../interfaces/repositories/IConversationRepository";
import { IMessageRepository } from "../interfaces/repositories/IMessageRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { IMessage } from "../types/chat.types";
import { IConversation } from "../models/conversation.model";
import { NotFoundError, ForbiddenError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { IChatService, ConversationListItem } from "../interfaces/services/IChatService";



export class ChatService implements IChatService {
    private _conversationRepository: IConversationRepository;
  private _messageRepository: IMessageRepository;
  private _providerProfileRepository: IProviderProfileRepository;
  private _bookingRepository: IBookingRepository;
  constructor(
    conversationRepository: IConversationRepository,
    messageRepository: IMessageRepository,
    providerProfileRepository: IProviderProfileRepository,
    bookingRepository: IBookingRepository
  ) {
    this._conversationRepository = conversationRepository;
    this._messageRepository = messageRepository;
    this._providerProfileRepository = providerProfileRepository;
    this._bookingRepository = bookingRepository;
}

  async getConversations(userId: string): Promise<ConversationListItem[]> {
    const conversations = await this._conversationRepository.findByUserIdPopulated(userId);

    const results = await Promise.all(
      conversations.map(async (c) => {
        const convId = c._id.toString();
        const lastMessage = await this._messageRepository.findLastByConversationId(convId);
        const unreadCount = await this._messageRepository.countUnread(convId, userId);
        const providerInfo = await this.resolveProviderInfo(c.participants as unknown as { role: string }[]);

        const obj = c.toObject();
        const pIndex = obj.participants.findIndex((p: { role: string }) => p.role === "provider");
        if (pIndex >= 0 && providerInfo.profilePhoto) {
          obj.participants[pIndex].profilePhoto = providerInfo.profilePhoto;
        }

        return {
          ...obj,
          lastMessage,
          unreadCount,
          providerServiceName: providerInfo.serviceName,
        };
      })
    );

    return results.sort((a, b) => {
      const timeA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.updatedAt).getTime();
      const timeB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime() 
        : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
  }

  async getOrCreateDirectConversation(userId: string, targetUserId: string): Promise<unknown> {
    const existing = await this._conversationRepository.findDirectBetweenUsers(userId, targetUserId);
    if (existing.length > 0) {
      return this.enrichConversation(existing[0], userId);
    }

    const created = await this._conversationRepository.createDirect([userId, targetUserId]);
    const populated = await this._conversationRepository.findByIdOrBookingIdPopulated(created._id.toString());
    if (!populated) throw new NotFoundError(ERROR_MESSAGES.CHAT_CONVERSATION_NOT_FOUND);
    return this.enrichConversation(populated, userId);
  }

  async getChatHistory(conversationIdOrBookingId: string, userId: string): Promise<IMessage[]> {
    const conversation = await this._conversationRepository.findByIdOrBookingIdPopulated(
      conversationIdOrBookingId
    );
    if (!conversation) throw new NotFoundError(ERROR_MESSAGES.CHAT_CONVERSATION_NOT_FOUND);
    if (!this._conversationRepository.isParticipant(conversation, userId)) {
      throw new ForbiddenError(ERROR_MESSAGES.CHAT_ACCESS_DENIED);
    }
    return this._messageRepository.findByConversationId(conversation._id.toString());
  }

  async saveMessage(
    conversationIdOrBookingId: string,
    senderId: string,
    senderRole: "user" | "provider",
    content: string
  ): Promise<IMessage> {
    let conversation = await this._conversationRepository.findByIdOrBookingIdPopulated(
      conversationIdOrBookingId
    );

    if (!conversation) {
      const booking = await this._bookingRepository.findById(conversationIdOrBookingId);
      if (booking) {
        const provProfile = await this._providerProfileRepository.findById(booking.providerId.toString());
        if (provProfile) {
          conversation = await this._conversationRepository.createForBooking(
            [booking.userId.toString(), provProfile.userId.toString()],
            booking._id.toString()
          );
          conversation = await this._conversationRepository.findByIdOrBookingIdPopulated(
            conversation._id.toString()
          );
        }
      }
    }

    if (!conversation) throw new NotFoundError(ERROR_MESSAGES.CHAT_CONVERSATION_NOT_FOUND);
    if (!this._conversationRepository.isParticipant(conversation, senderId)) {
      throw new ForbiddenError(ERROR_MESSAGES.CHAT_ACCESS_DENIED);
    }

    const savedMsg = await this._messageRepository.createTextMessage({
      conversationId: conversation._id.toString(),
      bookingId: conversation.bookingId?.toString() ?? null,
      senderId,
      senderRole,
      content,
    });

    await this._conversationRepository.touchUpdatedAt(conversation._id.toString());
    return savedMsg;
  }

  async markAsRead(conversationIdOrBookingId: string, userId: string): Promise<void> {
    const conversation = await this._conversationRepository.findByIdOrBookingIdPopulated(
      conversationIdOrBookingId
    );
    if (!conversation) return;
    if (!this._conversationRepository.isParticipant(conversation, userId)) return;
    await this._messageRepository.markReadByConversation(conversation._id.toString(), userId);
  }

  async markAsDelivered(userId: string): Promise<string[]> {
    const conversations = await this._conversationRepository.findByUserIdPopulated(userId);
    const conversationIds = conversations.map((c) => c._id.toString());
    const undeliveredIds = await this._messageRepository.findUndeliveredConversationIds(
      userId,
      conversationIds
    );
    await this._messageRepository.markDeliveredForUserInConversations(conversationIds, userId);
    return undeliveredIds;
  }

  async markMessageDelivered(messageId: string): Promise<void> {
    await this._messageRepository.updateById(messageId, { delivered: true } as Partial<IMessage>);
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this._conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError(ERROR_MESSAGES.CHAT_CONVERSATION_NOT_FOUND);
    if (!this._conversationRepository.isParticipant(conversation, userId)) {
      throw new ForbiddenError(ERROR_MESSAGES.CHAT_ACCESS_DENIED);
    }
    await this._messageRepository.deleteByConversationId(conversationId);
    await this._conversationRepository.deleteById(conversationId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
    const updated = await this._messageRepository.softDelete(messageId, userId);
    if (!updated) {
      const message = await this._messageRepository.findById(messageId);
      if (!message) throw new NotFoundError(ERROR_MESSAGES.CHAT_MESSAGE_NOT_FOUND);
      throw new ForbiddenError(ERROR_MESSAGES.CHAT_CANNOT_DELETE_MESSAGE);
    }
    return updated;
  }

  private async resolveProviderInfo(
    participants: { role: string; _id?: unknown; id?: unknown }[]
  ): Promise<{ serviceName: string; profilePhoto?: string }> {
    try {
      const providerParticipant = participants.find((p) => p.role === "provider");
      if (!providerParticipant) return { serviceName: "Service Provider" };

      const providerIdStr = providerParticipant._id ? String(providerParticipant._id) : String(providerParticipant.id);
      const profile = await this._providerProfileRepository.findByUserIdWithDetails(providerIdStr);

      return {
        serviceName: (profile as unknown as { serviceId?: { name: string } })?.serviceId?.name || "Service Provider",
        profilePhoto: profile?.profilePhoto,
      };
    } catch {
      return { serviceName: "Service Provider" };
    }
  }

  private async enrichConversation(conversation: IConversation, _userId: string) {
    const obj = conversation.toObject();
    const providerInfo = await this.resolveProviderInfo(obj.participants as unknown as { role: string; _id?: unknown; id?: unknown }[]);
    const pIndex = obj.participants.findIndex((p: { role: string }) => p.role === "provider");
    if (pIndex >= 0 && providerInfo.profilePhoto) {
      obj.participants[pIndex].profilePhoto = providerInfo.profilePhoto;
    }
    obj.providerServiceName = providerInfo.serviceName;
    return obj;
  }
}