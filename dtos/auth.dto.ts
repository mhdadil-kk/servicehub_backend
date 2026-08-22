import { z } from "zod";
import { UserRole, UserStatus } from "../types/user.types";

export const SignupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["user", "provider"])
  })
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
  })
});

export const OTPRequestSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format")
  })
});

export const OTPVerifySchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits")
  })
});

export const ResetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters")
  })
});

export const ChangePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters")
  })
});

export const UpdateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional()
  })
});

export const GoogleLoginSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Google token is required"),
    role: z.enum(["user", "provider"]).optional()
  })
});

export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  })
});

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profilePhoto?: string;
  is_verified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseDTO {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}
