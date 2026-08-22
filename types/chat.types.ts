import mongoose from "mongoose";

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  id: string;
  conversationId: string | mongoose.Types.ObjectId;
  bookingId?: string | mongoose.Types.ObjectId | null;
  senderId: string | mongoose.Types.ObjectId;
  senderRole: "user" | "provider";
  messageType?: "text" | "booking_card" | "image";
  content: string;
  imageUrl?: string;      
  imagePublicId?: string;  
  read: boolean;
  delivered?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedParticipant {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
}

export interface IConversation {
  _id?: mongoose.Types.ObjectId;
  id: string;
  participants: (string | mongoose.Types.ObjectId | IPopulatedParticipant)[];
  bookingId?: string | mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; date?: string; slot?: { start: string; end: string }; status?: string } | null;
  unreadCount?: number;
  lastMessage?: IMessage | null;
  providerServiceName?: string;
  createdAt: Date;
  updatedAt: Date;
}
