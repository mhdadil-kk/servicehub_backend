import { IUser } from "../../types/user.types";

export interface IAuthService {
  signup(data: Partial<IUser>): Promise<IUser>;
  login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  requestOTP(email: string, type: "verification" | "reset_password"): Promise<void>;
  verifyEmail(email: string, otp: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  googleLogin(token: string, role?: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<{ user: IUser }>;
}
