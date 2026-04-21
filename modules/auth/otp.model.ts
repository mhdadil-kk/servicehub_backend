import mongoose, { Schema } from "mongoose";
import { IOTP } from "./auth.types";

const OTPSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  expires_at: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ["verification", "reset_password"], 
    required: true 
  },
});

// Automatically delete document after expiry
OTPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const OTPModel = mongoose.model<IOTP>("OTP", OTPSchema);
export default OTPModel;
