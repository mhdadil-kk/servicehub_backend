import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: "user" | "provider" | "admin";
  profilePhoto?: string;
  is_verified: boolean;
  status: "active" | "suspended" | "pending";
  id: string;
  isDeleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export type UserResponseDTO = Omit<IUser, "password" | "isDeleted">;
