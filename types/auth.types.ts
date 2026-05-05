import mongoose, { Document } from "mongoose";

export interface IOTP extends Document {
  user_id: mongoose.Types.ObjectId;
  code: string;
  expires_at: Date;
  type: "verification" | "reset_password";
  id: string;
}
