import mongoose, { Schema } from "mongoose";
import { IBooking } from "../types/booking.types";

const BookingSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  slot: {
    start: { type: String, required: true }, // Format: HH:MM
    end: { type: String, required: true }     // Format: HH:MM
  },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "completed", "cancelled", "rescheduled"], 
    default: "pending" 
  },
  notes: { type: String },
  cancelledBy: { type: String, enum: ["user", "provider"] },
  cancellationReason: { type: String },
  rescheduledFrom: { type: Schema.Types.ObjectId, ref: "Booking" }
}, { timestamps: true });

// Create indexes for fast lookup
BookingSchema.index({ userId: 1 });
BookingSchema.index({ providerId: 1 });
BookingSchema.index({ date: 1 });

export default mongoose.model<IBooking>("Booking", BookingSchema);
