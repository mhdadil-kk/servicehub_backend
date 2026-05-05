import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: "user" | "provider" | "admin";
  is_verified: boolean;
  status: "active" | "suspended" | "pending";
  id: string;
  isDeleted: boolean; // For SOFT DELETE
  created_at: Date;
  updated_at: Date;
}
