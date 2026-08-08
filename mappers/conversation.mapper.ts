import { IConversation } from "../types/chat.types";

export interface ParticipantDTO {
  _id: string;
  name: string;
  profilePhoto?: string;
  role?: string;
}

export interface BookingRefDTO {
  _id: string;
  date: string;
  slot: { start: string; end: string };
  status: string;
}

export interface ConversationResponseDTO {
  _id: string;
  participants: ParticipantDTO[];
  bookingId?: BookingRefDTO | string | null;
  lastMessage?: Record<string, unknown>;
  unreadCount?: number;
  providerServiceName?: string;
  createdAt: string;
  updatedAt: string;
}

export class ConversationMapper {
  static toResponse(conversation: IConversation & { toObject?: () => IConversation }): ConversationResponseDTO | null {
    if (!conversation) return null;

    const c = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation;

    const participants: ParticipantDTO[] = (c.participants || []).map((p: string | Record<string, unknown>) => {
      if (typeof p === 'object' && p !== null) {
        const pObj = p as { _id?: { toString: () => string }; id?: { toString: () => string }; name?: string; profilePhoto?: string; role?: string };
        return {
          _id: (pObj._id || pObj.id)?.toString() ?? '',
          name: pObj.name || '',
          profilePhoto: pObj.profilePhoto,
          role: pObj.role,
        };
      }
      return { _id: (p as unknown as { toString: () => string }).toString(), name: '' };
    });

    let bookingId: BookingRefDTO | string | null = null;
    if (c.bookingId) {
      if (typeof c.bookingId === 'object' && c.bookingId !== null) {
        const bObj = c.bookingId as unknown as { _id?: { toString: () => string }; date?: string; slot?: { start: string; end: string }; status?: string };
        bookingId = {
          _id: bObj._id?.toString() ?? (c.bookingId as unknown as { toString: () => string }).toString(),
          date: bObj.date ?? '',
          slot: bObj.slot ?? { start: '', end: '' },
          status: bObj.status ?? '',
        };
      } else {
        bookingId = (c.bookingId as unknown as { toString: () => string }).toString();
      }
    }

    return {
      _id: c.id || (c as IConversation & { _id?: { toString: () => string } })._id?.toString() || "",
      participants,
      bookingId,
      lastMessage: (c as IConversation & { lastMessage?: Record<string, unknown> }).lastMessage ?? undefined,
      unreadCount: (c as IConversation & { unreadCount?: number }).unreadCount ?? 0,
      providerServiceName: (c as IConversation & { providerServiceName?: string }).providerServiceName,
      createdAt: new Date(c.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(c.updatedAt || Date.now()).toISOString(),
    };
  }

  static toDetailedResponse(conversation: IConversation & { toObject?: () => IConversation }): ConversationResponseDTO | null {
    return this.toResponse(conversation);
  }

  static toArrayResponse(conversations: (IConversation & { toObject?: () => IConversation })[], _detailed?: boolean): ConversationResponseDTO[] {
    return conversations.map(conv => this.toResponse(conv)!).filter(Boolean);
  }
}
