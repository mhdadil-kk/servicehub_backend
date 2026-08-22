import { Router } from "express";
import { authService } from "../di/container";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ROUTES } from "../constants/routes";
import {SignupSchema,LoginSchema,OTPVerifySchema,OTPRequestSchema,
  ResetPasswordSchema,ChangePasswordSchema,UpdateProfileSchema} from "../dtos/auth.dto";

const router = Router();
const authController = new AuthController(authService);

router.post(ROUTES.AUTH.SIGNUP,validate(SignupSchema), authController.signup);
router.post(ROUTES.AUTH.LOGIN, validate(LoginSchema), authController.login);
router.post(ROUTES.AUTH.VERIFY_OTP, validate(OTPVerifySchema), authController.verifyEmail);
router.post(ROUTES.AUTH.FORGOT_PASSWORD,validate(OTPRequestSchema), authController.requestResetPassword);
router.post(ROUTES.AUTH.RESET_PASSWORD, validate(ResetPasswordSchema), authController.resetPassword);
router.post(ROUTES.AUTH.GOOGLE,authController.googleLogin);
router.post(ROUTES.AUTH.REFRESH, authController.refreshToken);

router.put(ROUTES.AUTH.CHANGE_PASSWORD,authMiddleware, validate(ChangePasswordSchema), authController.changePassword);
router.put(ROUTES.AUTH.PROFILE, authMiddleware, validate(UpdateProfileSchema), authController.updateProfile);

export default router;