import { Document } from "mongoose";



export type UserRole   = "user" | "provider" | "admin";

export type UserStatus = "approved" | "rejected" | "pending";

export interface IUser extends Document {
  name:          string;
  email:         string;
  phone?:        string;
  password?:     string;
  role:          UserRole;
  profilePhoto?: string;
  is_verified:   boolean;
  status:        UserStatus;
  id:            string;
  isDeleted:     boolean;
  createdAt:     Date;
  updatedAt:     Date;
}
