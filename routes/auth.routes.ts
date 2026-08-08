import { Router } from "express";
import { authService } from "../di/container";  
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  SignupSchema,
  LoginSchema,
  OTPVerifySchema,
  OTPRequestSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  UpdateProfileSchema
} from "../dtos/auth.dto";


const router = Router();
const authController = new AuthController(authService);

router.post("/signup", validate(SignupSchema), authController.signup);
router.post("/login", validate(LoginSchema), authController.login);
router.post("/verify-email", validate(OTPVerifySchema), authController.verifyEmail);
router.post("/forgot-password", validate(OTPRequestSchema), authController.requestResetPassword);
router.post("/reset-password", validate(ResetPasswordSchema), authController.resetPassword);
router.post("/google", authController.googleLogin);
router.post("/refresh-token", authController.refreshToken);

router.put("/change-password", authMiddleware, validate(ChangePasswordSchema), authController.changePassword);
router.put("/profile", authMiddleware, validate(UpdateProfileSchema), authController.updateProfile);

export default router;
