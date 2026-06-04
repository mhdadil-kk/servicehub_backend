import mongoose, { Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId | null;
  senderId: mongoose.Types.ObjectId;
  senderRole: "user" | "provider";
  messageType?: "text" | "booking_card";
  content: string;
  read: boolean;
  delivered?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
