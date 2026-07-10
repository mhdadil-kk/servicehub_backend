import mongoose, { Document } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  addressId: mongoose.Types.ObjectId;
  date: string; 
  slot: {
    start: string; 
    end: string; 
  };
  status: "pending" | "awaiting_payment" | "confirmed" | "in_progress" | "completed_pending_payment" | "completed" | "cancelled" | "rescheduled" | "awaiting_user_confirmation";
  notes?: string;
  cancelledBy?: "user" | "provider";
  cancellationReason?: string;
  rescheduledFrom?: mongoose.Types.ObjectId;
  rescheduledTo?: mongoose.Types.ObjectId;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "fully_paid";
  stripeSessionId?: string;
  arrivalOtp?: string;
  completionOtp?: string;
  finalInvoice?: {
    baseCharge: number;
    extraCharges: Array<{ description: string; amount: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
}
