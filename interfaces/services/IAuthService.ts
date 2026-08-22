import { IUser } from "../../types/user.types";
import { UserResponseDTO, AuthResponseDTO } from "../../dtos/auth.dto";

export interface IAuthService {
  signup(data: Partial<IUser>): Promise<UserResponseDTO>;
  login(email: string, password: string): Promise<AuthResponseDTO>;
  requestOTP(email: string, type: "verification" | "reset_password"): Promise<void>;
  verifyEmail(email: string, otp: string): Promise<AuthResponseDTO>;
  resetPassword(email: string, token: string, newPassword: string): Promise<void>;
  googleLogin(token: string, role?: string): Promise<AuthResponseDTO>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<{ user: UserResponseDTO }>;
}
