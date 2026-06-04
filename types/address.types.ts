import mongoose, { Document } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
