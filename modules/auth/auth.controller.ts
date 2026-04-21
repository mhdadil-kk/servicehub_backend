import { Request, Response, NextFunction } from "express";
import { IAuthService } from "./auth.service";
import { formatUserResponse } from "./auth.dto";
import { HttpStatusCode } from "../../types/http";
import { createSuccessResponse } from "../../types/response";
import { SUCCESS_MESSAGES } from "../../constants/messages";

export class AuthController {
  private authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.signup(req.body);
      res.status(HttpStatusCode.CREATED).json(
        createSuccessResponse({ user: formatUserResponse(user) }, SUCCESS_MESSAGES.SIGNUP_SUCCESS)
      );
    } catch (error) { next(error); }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await this.authService.login(email, password);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { user: formatUserResponse(user), accessToken, refreshToken },
          SUCCESS_MESSAGES.LOGIN_SUCCESS
        )
      );
    } catch (error) { next(error); }
  };

  requestOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this.authService.requestOTP(email, "verification");
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.OTP_SENT)
      );
    } catch (error) { next(error); }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      const { user, accessToken, refreshToken } = await this.authService.verifyEmail(email, otp);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { user: formatUserResponse(user), accessToken, refreshToken },
          SUCCESS_MESSAGES.OTP_VERIFIED
        )
      );
    } catch (error) { next(error); }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this.authService.requestOTP(email, "reset_password");
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.OTP_SENT)
      );
    } catch (error) { next(error); }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, token, newPassword } = req.body;
      await this.authService.resetPassword(email, token, newPassword);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, "Password reset successfully.")
      );
    } catch (error) { next(error); }
  };

  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, role } = req.body;
      const { user, accessToken, refreshToken } = await this.authService.googleLogin(token, role);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { user: formatUserResponse(user), accessToken, refreshToken },
          SUCCESS_MESSAGES.LOGIN_SUCCESS
        )
      );
    } catch (error) { next(error); }
  };
}
