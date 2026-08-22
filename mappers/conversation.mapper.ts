import { IConversation, IMessage } from "../types/chat.types";
import { ConversationResponseDTO, ParticipantDTO, BookingRefDTO } from "../dtos/chat.dto";
import { MessageMapper } from "./message.mapper";

export class ConversationMapper {
  static toResponse(
    conversation: IConversation & {
      toObject?: () => IConversation;
      unreadCount?: number;
      providerServiceName?: string;
    }
  ): ConversationResponseDTO | null {
    if (!conversation) return null;

    const c = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation;

    const participants: ParticipantDTO[] = (c.participants || []).map((p) => {
      if (typeof p === 'object' && p !== null && '_id' in p) {
        return {
          _id: p._id.toString(),
          name: p.name || '',
          profilePhoto: p.profilePhoto,
          role: p.role,
        };
      }
      return { _id: p ? p.toString() : '', name: '' };
    });

    let bookingRef: BookingRefDTO | string | undefined = undefined;
    if (c.bookingId) {
      if (typeof c.bookingId === 'object' && '_id' in c.bookingId) {
        const b = c.bookingId;
        bookingRef = {
          _id: b._id.toString(),
          date: b.date,
          slot: b.slot,
          status: b.status,
        };
      } else {
        bookingRef = c.bookingId.toString();
      }
    }

    return {
      _id: c._id?.toString() || c.id || '',
      participants,
      bookingId: bookingRef,
      unreadCount: conversation.unreadCount || 0,
      lastMessage: c.lastMessage ? MessageMapper.toResponse(c.lastMessage as IMessage) : null,
      providerServiceName: conversation.providerServiceName,
      createdAt: new Date(c.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(c.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(
    conversations: (IConversation & {
      toObject?: () => IConversation;
      unreadCount?: number;
      providerServiceName?: string;
    })[]
  ): ConversationResponseDTO[] {
    return conversations.map(c => this.toResponse(c)!);
  }
}
