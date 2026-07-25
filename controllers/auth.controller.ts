import { Request, Response, NextFunction } from "express";
import { IAuthService } from "../interfaces/services/IAuthService";
import { UserMapper } from "../mappers/user.mapper";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { BadRequestError } from "../utils/error";


export class AuthController {
  private _authService: IAuthService;

  constructor(authService: IAuthService) {
    this._authService = authService;
  }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this._authService.signup(req.body);
      res.status(HttpStatusCode.CREATED).json(
        createSuccessResponse({ user: UserMapper.toResponse(user) }, SUCCESS_MESSAGES.SIGNUP_SUCCESS)
      );
    } catch (error) { next(error); }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await this._authService.login(email, password);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { user: UserMapper.toResponse(user), accessToken, refreshToken },
          SUCCESS_MESSAGES.LOGIN_SUCCESS
        )
      );
    } catch (error) { next(error); }
  };

  requestOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this._authService.requestOTP(email, "verification");
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.OTP_SENT)
      );
    } catch (error) { next(error); }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      const { user, accessToken, refreshToken } = await this._authService.verifyEmail(email, otp);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { user: UserMapper.toResponse(user), accessToken, refreshToken },
          SUCCESS_MESSAGES.OTP_VERIFIED
        )
      );
    } catch (error) { next(error); }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this._authService.requestOTP(email, "reset_password");
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.OTP_SENT)
      );
    } catch (error) { next(error); }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, token, newPassword } = req.body;
      await this._authService.resetPassword(email, token, newPassword);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS)
      );
    } catch (error) { next(error); }
  };

  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, role } = req.body;
      const { user, accessToken, refreshToken } = await this._authService.googleLogin(token, role);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { user: UserMapper.toResponse(user), accessToken, refreshToken },
          SUCCESS_MESSAGES.LOGIN_SUCCESS
        )
      );
    } catch (error) { next(error); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new BadRequestError("Refresh token is required");
      
      const { accessToken } = await this._authService.refreshToken(refreshToken);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse({ accessToken }, SUCCESS_MESSAGES.TOKEN_REFRESHED)
      );
    } catch (error) { next(error); }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { oldPassword, newPassword } = req.body;
      await this._authService.changePassword(userId, oldPassword, newPassword);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.PASSWORD_CHANGED)
      );
    } catch (error) { next(error); }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { name, phone } = req.body;
      const { user } = await this._authService.updateProfile(userId, { name, phone });
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse({ user: UserMapper.toResponse(user) }, SUCCESS_MESSAGES.PROFILE_UPDATED)
      );
    } catch (error) { next(error); }
  };
}

