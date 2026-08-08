import { Request, Response } from "express";
import { IAuthService } from "../interfaces/services/IAuthService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { asyncHandler } from "../utils/async-handler";


export class AuthController {
  constructor(private _authService: IAuthService) {}

  signup = asyncHandler(async (req: Request, res: Response) => {
    const user = await this._authService.signup(req.body);
    res.status(HttpStatusCode.CREATED).json(
      createSuccessResponse(user, SUCCESS_MESSAGES.SIGNUP_SUCCESS)
    );
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await this._authService.login(email, password);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(result, SUCCESS_MESSAGES.LOGIN_SUCCESS)
    );
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await this._authService.verifyEmail(email, otp);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(result, SUCCESS_MESSAGES.EMAIL_VERIFIED)
    );
  });

  requestResetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await this._authService.requestOTP(email, "reset_password");
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, SUCCESS_MESSAGES.RESET_LINK_SENT)
    );
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;
    await this._authService.resetPassword(email, token, newPassword);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS)
    );
  });

  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { token, role } = req.body;
    const result = await this._authService.googleLogin(token, role);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(result, SUCCESS_MESSAGES.LOGIN_SUCCESS)
    );
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await this._authService.refreshToken(refreshToken);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(result, "Token refreshed successfully")
    );
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { oldPassword, newPassword } = req.body;
    await this._authService.changePassword(userId, oldPassword, newPassword);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, SUCCESS_MESSAGES.PASSWORD_CHANGED)
    );
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await this._authService.updateProfile(userId, req.body);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(result, "Profile updated successfully")
    );
  });
}
