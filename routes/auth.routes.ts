import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { AuthRepository } from "../repositories/auth.repository";
import { OTPRepository } from "../repositories/otp.repository";
import { Mailer } from "../utils/mailer";
import { validate } from "../middlewares/validate.middleware";
import { SignupSchema, LoginSchema, OTPRequestSchema, OTPVerifySchema, ResetPasswordSchema, GoogleLoginSchema, RefreshTokenSchema } from "../dtos/auth.dto";

const router = express.Router();

const userRepository = new AuthRepository();
const otpRepository = new OTPRepository();
const mailer = new Mailer();
const authService = new AuthService(userRepository, otpRepository, mailer);
const authController = new AuthController(authService);

router.post("/signup", 
    validate(SignupSchema), 
    authController.signup
);

router.post("/login", 
    validate(LoginSchema), 
    authController.login
);

router.post("/request-otp", 
    validate(OTPRequestSchema), 
    authController.requestOTP
);

router.post("/verify-otp", 
    validate(OTPVerifySchema), 
    authController.verifyEmail
);

router.post("/forgot-password", 
    validate(OTPRequestSchema), 
    authController.forgotPassword
);

router.post("/reset-password", 
    validate(ResetPasswordSchema), 
    authController.resetPassword
);

router.post("/google", 
    validate(GoogleLoginSchema),
    authController.googleLogin
);

router.post("/refresh",
    validate(RefreshTokenSchema),
    authController.refresh
);

export default router;
