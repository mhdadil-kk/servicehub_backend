import mongoose, { Schema, Document } from "mongoose";

export interface IConversationDocument extends Document {
  id: string; 
  participants: mongoose.Types.ObjectId[];
  bookingId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null }
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ bookingId: 1 });

ConversationSchema.index(
  { participants: 1, bookingId: 1 },
  { unique: false }  
);

export default mongoose.model<IConversationDocument>("Conversation", ConversationSchema);
