import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.types";


const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:        { type: String, trim: true },
 
    password:     { type: String, select: false },
    role:         { type: String, enum: ["user", "provider", "admin"], default: "user" },
    profilePhoto: { type: String },
    is_verified:  { type: Boolean, default: false },
    status:       { type: String, enum: ["approved", "rejected", "pending"], default: "approved" },
    isDeleted:    { type: Boolean, default: false, select: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.index({ email: 1, isDeleted: 1 });
UserSchema.index({ role: 1, isDeleted: 1 });

export const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
