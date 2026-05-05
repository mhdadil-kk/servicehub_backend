import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.types";

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String },
    role: { 
      type: String, 
      enum: ["user", "provider", "admin"], 
      default: "user" 
    },
    is_verified: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ["approved", "rejected", "pending"], 
      default: "approved" 
    },
    isDeleted: { type: Boolean, default: false },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
