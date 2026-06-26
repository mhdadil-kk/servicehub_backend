import mongoose, { Schema } from "mongoose";
import { IProviderProfile } from "../types/providerProfile.types";

const ProviderProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  bio: { type: String },
  profilePhoto: { type: String },
  serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
  hourlyRate: { type: Number },
  serviceRadius: { type: Number, default: 25 },
  address: { type: String },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  documents: {
    type: [{
      docType: { type: String, required: true },
      url: { type: String, required: true }
    }],
    default: []
  },
  onboardingStep: { type: Number, default: 1 },
  onboardingStatus: { type: String, enum: ["pending", "in_review", "approved", "rejected"], default: "pending" },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  rejectionReason: { type: String },
  bankDetails: {
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String }
  }
}, { timestamps: true });

ProviderProfileSchema.index({ location: "2dsphere" });

export default mongoose.model<IProviderProfile>("ProviderProfile", ProviderProfileSchema);
