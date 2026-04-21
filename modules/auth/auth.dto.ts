import { z } from "zod";


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

import { IUser } from "../users/user.types";

export const formatUserResponse = (user: IUser) => {
  const userObj = ('toObject' in user && typeof user.toObject === 'function') 
    ? user.toObject() 
    : user;
  const { password, __v, isDeleted, ...safeUser } = userObj as any; // Cast only for destructuring unknown fields
  return safeUser;
};
