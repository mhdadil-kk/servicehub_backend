import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types/chat.types";

const MessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: false },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["user", "provider"], required: true },
  messageType: { type: String, enum: ["text", "booking_card"], default: "text" },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });


MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ bookingId: 1, createdAt: 1 });

export default mongoose.model<IMessage>("Message", MessageSchema);
