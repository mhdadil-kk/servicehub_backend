import mongoose, { Schema, Document } from "mongoose";

export interface IMessageDocument extends Document {
  id: string;
  conversationId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId | null;
  senderId: mongoose.Types.ObjectId;
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

const MessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: false },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["user", "provider"], required: true },
  messageType: { type: String, enum: ["text", "booking_card", "image"], default: "text" },
  content: { type: String, required: true },
  imageUrl: { type: String },        
  imagePublicId: { type: String },   
  read: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ bookingId: 1, createdAt: 1 });

export default mongoose.model<IMessageDocument>("Message", MessageSchema);
