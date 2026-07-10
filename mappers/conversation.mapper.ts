import { IConversation } from "../models/conversation.model";

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
  lastMessage?: any;
  unreadCount?: number;
  providerServiceName?: string;
  createdAt: string;
  updatedAt: string;
}

export class ConversationMapper {
  static toResponse(conversation: IConversation | any): ConversationResponseDTO | null {
    if (!conversation) return null;

    const c = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation;

    const participants: ParticipantDTO[] = (c.participants || []).map((p: any) => {
      if (typeof p === 'object' && p !== null) {
        return {
          _id: (p._id || p.id)?.toString() ?? '',
          name: p.name || '',
          profilePhoto: p.profilePhoto,
          role: p.role,
        };
      }
      return { _id: p.toString(), name: '' };
    });

    let bookingId: BookingRefDTO | string | null = null;
    if (c.bookingId) {
      if (typeof c.bookingId === 'object' && c.bookingId !== null) {
        bookingId = {
          _id: c.bookingId._id?.toString() ?? c.bookingId.toString(),
          date: c.bookingId.date ?? '',
          slot: c.bookingId.slot ?? { start: '', end: '' },
          status: c.bookingId.status ?? '',
        };
      } else {
        bookingId = c.bookingId.toString();
      }
    }

    return {
      _id: c._id.toString(),
      participants,
      bookingId,
      lastMessage: c.lastMessage ?? null,
      unreadCount: c.unreadCount ?? 0,
      providerServiceName: c.providerServiceName,
      createdAt: new Date(c.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(c.updatedAt || Date.now()).toISOString(),
    };
  }

  static toDetailedResponse(conversation: IConversation | any): ConversationResponseDTO | null {
    return this.toResponse(conversation);
  }

  static toArrayResponse(conversations: any[]): ConversationResponseDTO[] {
    return conversations.map(conv => this.toResponse(conv)!).filter(Boolean);
  }
}
