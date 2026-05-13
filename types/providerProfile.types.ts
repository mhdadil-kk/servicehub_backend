import mongoose, { Document } from "mongoose";

export interface IProviderDocument {
  docType: string;
  url: string;
}

export interface IProviderProfile extends Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  profilePhoto?: string;
  serviceId?: mongoose.Types.ObjectId;
  hourlyRate?: number;
  serviceRadius?: number; 
  documents: any[];
  onboardingStep: number;
  onboardingStatus: "pending" | "in_review" | "approved" | "rejected";
  rejectionReason?: string;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
