export interface IMessage {
  id: string;
  conversationId: string;
  bookingId?: string | null;
  senderId: string;
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

export interface IConversation {
  id: string;
  participants: string[];
  bookingId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
