import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IOTPRepository } from "../interfaces/repositories/IOTPRepository";
import { IUser } from "../types/user.types";
import { IMailer } from "../utils/mailer";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import bcrypt from "bcrypt";
import { OTPGenerator } from "../utils/otp";
import { logger } from "../utils/logger";
import { IAuthService } from "../interfaces/services/IAuthService";
import { UserResponseDTO, AuthResponseDTO } from "../dtos/auth.dto";
import { UserMapper } from "../mappers/user.mapper";
import mongoose from "mongoose";

export class AuthService implements IAuthService {
  private _userRepository: IUserRepository;
  private _otpRepository: IOTPRepository;
  private _mailer: IMailer;

  constructor(
    userRepository: IUserRepository,
    otpRepository: IOTPRepository,
    mailer: IMailer
  ) {
    this._userRepository = userRepository;
    this._otpRepository = otpRepository;
    this._mailer = mailer;
  }

  async signup(data: Partial<IUser>): Promise<UserResponseDTO> {
    if (!data.email || !data.password) throw new BadRequestError(ERROR_MESSAGES.VALIDATION_ERROR);
    const existingUser = await this._userRepository.findByEmail(data.email);
    if (existingUser) throw new BadRequestError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const status = data.role === "provider" ? "pending" : "approved";
    
    const newUser = await this._userRepository.create({ 
      ...data, 
      password: hashedPassword, 
      is_verified: false, 
      status 
    });
    
    await this.requestOTP(data.email, "verification");
    return UserMapper.toResponse(newUser) as UserResponseDTO;
  }

  async login(email: string, password: string): Promise<AuthResponseDTO> {
    const user = await this._userRepository.findByEmailWithPassword(email);
    
    if (!user || user.isDeleted) throw new UnauthorizedError("Your account has been blocked or does not exist.");
    if (!user.password) throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    if (!user.is_verified) throw new UnauthorizedError("Email not verified. Please verify your OTP.");
    
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const userDTO = UserMapper.toResponse(user) as UserResponseDTO;
    return { user: userDTO, accessToken, refreshToken };
  }

  async requestOTP(email: string, type: "verification" | "reset_password"): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    
    const isReset = type === "reset_password";
    const code = isReset ? OTPGenerator.generateToken() : OTPGenerator.generate(6);
    const expiresAt = new Date(Date.now() + (isReset ? 60 : 5) * 60 * 1000); 
    
    await this._otpRepository.deleteByUserId(user.id);
    await this._otpRepository.create({ user_id: new mongoose.Types.ObjectId(user.id), code, expires_at: expiresAt, type });
    
    if (isReset) {
      await this._mailer.sendResetLink(email, code);
    } else {
      await this._mailer.sendOTP(email, code);
    }
  }

  async verifyEmail(email: string, otp: string): Promise<AuthResponseDTO> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    const otpRecord = await this._otpRepository.findLatest(user.id, "verification");
    if (!otpRecord) throw new BadRequestError(ERROR_MESSAGES.OTP_INVALID);
    OTPGenerator.verify(otp, otpRecord.code, otpRecord.expires_at);
    
    await this._userRepository.update(user.id, { is_verified: true });
    await this._otpRepository.delete(otpRecord.id);

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const userDTO = UserMapper.toResponse(user) as UserResponseDTO;
    return { user: userDTO, accessToken, refreshToken };
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    const otpRecord = await this._otpRepository.findLatest(user.id, "reset_password");
    if (!otpRecord) throw new BadRequestError("Reset link has expired or is invalid.");
    
    OTPGenerator.verify(token, otpRecord.code, otpRecord.expires_at);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this._userRepository.update(user.id, { password: hashedPassword });
    await this._otpRepository.delete(otpRecord.id);
  }

  async googleLogin(token: string, role?: string): Promise<AuthResponseDTO> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
      const payload = (await response.json()) as { email?: string; name?: string };

      if (!response.ok || !payload.email) {
        logger.error("Google Token Verification Failed:", payload);
        throw new UnauthorizedError("Invalid Google token or expired");
      }

      const { email, name } = payload;
      let user = await this._userRepository.findByEmail(email);

      if (!user) {
        const assignedRole = role === "provider" ? "provider" : "user";
        const status = assignedRole === "provider" ? "pending" : "approved";

        user = await this._userRepository.create({
          email,
          name: name || "Google User",
          role: assignedRole,
          is_verified: true,
          status
        });
      }

      if (user.isDeleted) throw new UnauthorizedError("Your account has been blocked.");

      const { accessToken, refreshToken } = generateTokens(user.id, user.role);
      const userDTO = UserMapper.toResponse(user) as UserResponseDTO;
      return { user: userDTO, accessToken, refreshToken };
    } catch (error: unknown) {
      logger.error("Google Login Error:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    const decoded = verifyRefreshToken(token);
    const user = await this._userRepository.findById(decoded.id);
    if (!user || user.isDeleted) throw new UnauthorizedError("User not found or blocked");
    
    const { accessToken } = generateTokens(user.id, user.role);
    return { accessToken };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this._userRepository.findByIdWithPassword(userId);
    if (!user || user.isDeleted) throw new UnauthorizedError("User not found or blocked");
    if (!user.password) throw new BadRequestError("User does not have a password set (e.g., registered via Google)");

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new BadRequestError(ERROR_MESSAGES.INCORRECT_PASSWORD);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this._userRepository.update(userId, { password: hashedPassword });
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<{ user: UserResponseDTO }> {
    const user = await this._userRepository.findById(userId);
    if (!user || user.isDeleted) throw new UnauthorizedError("User not found or blocked");
    
    await this._userRepository.update(userId, data);
    const updatedUser = await this._userRepository.findById(userId);
    const userDTO = UserMapper.toResponse(updatedUser) as UserResponseDTO;
    return { user: userDTO };
  }
}
