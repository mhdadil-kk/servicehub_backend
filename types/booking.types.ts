import mongoose, { Document } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  addressId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  slot: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  notes?: string;
  cancelledBy?: "user" | "provider";
  cancellationReason?: string;
  rescheduledFrom?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
