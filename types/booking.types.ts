import mongoose, { Document } from "mongoose";

export interface IPopulatedUserRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  profilePhoto?: string;
}

export interface IPopulatedProviderRef {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | { name?: string };
  profilePhoto?: string;
  hourlyRate?: number;
}

export interface IPopulatedServiceRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
}

export interface IPopulatedAddressRef {
  _id: mongoose.Types.ObjectId;
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId | IPopulatedUserRef;
  providerId: mongoose.Types.ObjectId | IPopulatedProviderRef;
  serviceId: mongoose.Types.ObjectId | IPopulatedServiceRef;
  addressId: mongoose.Types.ObjectId | IPopulatedAddressRef;
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
  paymentIntentId?: string;
  arrivalOtp?: string;
  completionOtp?: string;
  finalInvoice?: {
    baseCharge: number;
    extraCharges: Array<{ description: string; amount: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
}
