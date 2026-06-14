import { Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "otp" | "message";
  isRead: boolean;
  relatedId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
