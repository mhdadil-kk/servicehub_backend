import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { AuthRepository } from "../repositories/auth.repository";
import { OTPRepository } from "../repositories/otp.repository";
import { Mailer } from "../utils/mailer";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { SignupSchema, LoginSchema, OTPRequestSchema, OTPVerifySchema, ResetPasswordSchema, ChangePasswordSchema, UpdateProfileSchema, GoogleLoginSchema, RefreshTokenSchema } from "../dtos/auth.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const userRepository = new AuthRepository();
const otpRepository = new OTPRepository();
const mailer = new Mailer();
const authService = new AuthService(userRepository, otpRepository, mailer);
const authController = new AuthController(authService);

router.post(ROUTES.AUTH.SIGNUP, 
    validate(SignupSchema), 
    authController.signup
);

router.post(ROUTES.AUTH.LOGIN, 
    validate(LoginSchema), 
    authController.login
);

router.post(ROUTES.AUTH.REQUEST_OTP, 
    validate(OTPRequestSchema), 
    authController.requestOTP
);

router.post(ROUTES.AUTH.VERIFY_OTP, 
    validate(OTPVerifySchema), 
    authController.verifyEmail
);

router.post(ROUTES.AUTH.FORGOT_PASSWORD, 
    validate(OTPRequestSchema), 
    authController.forgotPassword
);

router.post(ROUTES.AUTH.RESET_PASSWORD, 
    validate(ResetPasswordSchema), 
    authController.resetPassword
);

router.post(ROUTES.AUTH.GOOGLE, 
    validate(GoogleLoginSchema),
    authController.googleLogin
);

router.post(ROUTES.AUTH.REFRESH,
    validate(RefreshTokenSchema),
    authController.refresh
);

router.post(ROUTES.AUTH.CHANGE_PASSWORD,
    authMiddleware,
    validate(ChangePasswordSchema),
    authController.changePassword
);

router.patch(ROUTES.AUTH.PROFILE,
    authMiddleware,
    validate(UpdateProfileSchema),
    authController.updateProfile
);

export default router;
