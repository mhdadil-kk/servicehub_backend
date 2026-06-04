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
  address?: string;                
  location?: {                     
    type: "Point";
    coordinates: [number, number]; 
  };
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

export interface ITimeSlot {
  id: string;
  start: string;
  end: string;
  startDate?: string;
  endDate?: string;
  rrule?: string;
}

export interface IDaySchedule {
  isAvailable: boolean;
  slots: ITimeSlot[];
}

export interface IDateOverride {
  id: string;
  date: string;
  isAvailable: boolean;
  slots: ITimeSlot[];
}

export interface IProviderAvailability extends Document {
  providerId: mongoose.Types.ObjectId;
  startDate?: string;
  endDate?: string;
  weeklySchedule: {
    Monday: IDaySchedule;
    Tuesday: IDaySchedule;
    Wednesday: IDaySchedule;
    Thursday: IDaySchedule;
    Friday: IDaySchedule;
    Saturday: IDaySchedule;
    Sunday: IDaySchedule;
  };
  overrides: IDateOverride[];
  createdAt: Date;
  updatedAt: Date;
}
