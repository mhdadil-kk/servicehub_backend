import crypto from "crypto";
import { AppError } from "./error";
import { ERROR_MESSAGES } from "../constants/messages";

export class OTPGenerator {
  static generate(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        const index = crypto.randomInt(0, 10); 
        otp += digits[index];
    }
    return otp;
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static verify(providedOtp: string, actualOtp: string, expiry: Date): boolean {
    const now = new Date();
    if (now > expiry) throw new AppError(ERROR_MESSAGES.OTP_EXPIRED, 400);
    if (providedOtp !== actualOtp) throw new AppError(ERROR_MESSAGES.OTP_INVALID, 400);
    return true;
  }
}
