import { z } from "zod";

export const DirectConversationSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1),
  }),
});

export interface ParticipantDTO {
  _id: string;
  name: string;
  profilePhoto?: string;
  role?: string;
}

export interface BookingRefDTO {
  _id: string;
  date?: string;
  slot?: {
    start: string;
    end: string;
  };
  status?: string;
}

export interface ConversationResponseDTO {
  _id: string;
  participants: ParticipantDTO[];
  bookingId?: BookingRefDTO | string | null;
  unreadCount?: number;
  lastMessage?: MessageResponseDTO | null;
  providerServiceName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponseDTO {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: "user" | "provider";
  messageType: "text" | "image" | "booking_card";
  content: string;
  imageUrl?: string;
  imagePublicId?: string;
  bookingId?: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
  updatedAt: string;
}
