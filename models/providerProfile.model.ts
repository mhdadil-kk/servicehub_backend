import mongoose, { Schema } from "mongoose";
import { IProviderProfile } from "../types/providerProfile.types";

const ProviderProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  bio: { type: String },
  profilePhoto: { type: String },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
  hourlyRate: { type: Number },
  serviceRadius: { type: Number, default: 25 },
  documents: { type: Array, default: [] },
  onboardingStep: { type: Number, default: 1 },
  onboardingStatus: { type: String, enum: ["pending", "in_review", "approved", "rejected"], default: "pending" },
  rejectionReason: { type: String },
  bankDetails: {
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String }
  }
}, { timestamps: true });

export default mongoose.model<IProviderProfile>("ProviderProfile", ProviderProfileSchema);
