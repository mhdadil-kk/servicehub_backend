import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification.types";

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["info", "success", "warning", "otp", "message"], 
    default: "info" 
  },
  isRead: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
