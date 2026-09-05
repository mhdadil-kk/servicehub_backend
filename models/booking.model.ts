import mongoose, { Schema } from "mongoose";
import { IBooking } from "../types/booking.types";


const BookingSchema = new Schema<IBooking>({
  userId:     { type: Schema.Types.ObjectId, ref: "User",            required: true },
  providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
  serviceId:  { type: Schema.Types.ObjectId, ref: "Service",         required: true },
  addressId:  { type: Schema.Types.ObjectId, ref: "Address",         required: true },
  date:       { type: String, required: true },
  slot: {
    start: { type: String, required: true },
    end:   { type: String, required: true },
  },
  status: {
    type: String,
    enum: [
      "pending", "awaiting_payment", "confirmed", "in_progress",
      "completed_pending_payment", "completed", "cancelled", "rescheduled",
      "awaiting_user_confirmation",
    ],
    default: "pending",
  },
  notes:              { type: String },
  cancelledBy:        { type: String, enum: ["user", "provider"] },
  cancellationReason: { type: String },
  rescheduledFrom:    { type: Schema.Types.ObjectId, ref: "Booking" },
  rescheduledTo:      { type: Schema.Types.ObjectId, ref: "Booking" },
  totalAmount:        { type: Number, default: 0 },
  paymentStatus:      { type: String, enum: ["pending", "paid", "failed", "fully_paid"], default: "pending" },
  stripeSessionId:    { type: String },
  arrivalOtp:         { type: String },
  completionOtp:      { type: String },
  finalInvoice: {
    baseCharge:   { type: Number },
    extraCharges: [{ description: { type: String }, amount: { type: Number } }],
  },
}, { timestamps: true });

BookingSchema.index({ providerId: 1, date: 1, status: 1 });
BookingSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IBooking>("Booking", BookingSchema);
