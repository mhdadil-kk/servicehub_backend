import { IUserRepository } from "./auth.repository";
import { IOTPRepository } from "./otp.repository";
import { IUser } from "../users/user.types";
import { IMailer } from "../../utils/mailer";
import { generateTokens } from "../../utils/jwt";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../utils/error";
import { ERROR_MESSAGES } from "../../constants/messages";
import bcrypt from "bcrypt";
import { OTPGenerator } from "../../utils/otp";
import { OAuth2Client } from "google-auth-library";
import { logger } from "../../utils/logger";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export interface IAuthService {
  signup(data: Partial<IUser>): Promise<IUser>;
  login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  requestOTP(email: string, type: "verification" | "reset_password"): Promise<void>;
  verifyEmail(email: string, otp: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  googleLogin(token: string, role?: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
}

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;
  private otpRepository: IOTPRepository;
  private mailer: IMailer;

  constructor(
    userRepository: IUserRepository,
    otpRepository: IOTPRepository,
    mailer: IMailer
  ) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
    this.mailer = mailer;
  }

  async signup(data: Partial<IUser>): Promise<IUser> {
    if (!data.email || !data.password) throw new BadRequestError(ERROR_MESSAGES.VALIDATION_ERROR);
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) throw new BadRequestError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Providers: pending, Users: approved
    const status = data.role === "provider" ? "pending" : "approved";
    
    const newUser = await this.userRepository.create({ 
      ...data, 
      password: hashedPassword, 
      is_verified: false, 
      status 
    });
    
    await this.requestOTP(data.email, "verification");
    return newUser;
  }


  async login(email: string, password: string) {
    // Include deleted users during login check to provide specific error messages if needed, 
    // or we can just let it fail. But better to check.
    const user = await this.userRepository.findByEmail(email);
    
    if (!user || user.isDeleted) throw new UnauthorizedError("Your account has been blocked or does not exist.");
    if (!user.password) throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    
    // if (user.status === "rejected") throw new UnauthorizedError("Your account application has been rejected.");
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    if (!user.is_verified) throw new UnauthorizedError("Email not verified. Please verify your OTP.");
    
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    return { user, accessToken, refreshToken };
  }

  async requestOTP(email: string, type: "verification" | "reset_password"): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    
    const isReset = type === "reset_password";
    const code = isReset ? OTPGenerator.generateToken() : OTPGenerator.generate(6);
    const expiresAt = new Date(Date.now() + (isReset ? 60 : 5) * 60 * 1000); // 1 hour for reset, 5 mins for verify
    
    await this.otpRepository.deleteByUserId(user.id);
    await this.otpRepository.create({ user_id: user.id as string, code, expires_at: expiresAt, type });
    
    if (isReset) {
      await this.mailer.sendResetLink(email, code);
    } else {
      await this.mailer.sendOTP(email, code);
    }
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    const otpRecord = await this.otpRepository.findLatest(user.id, "verification");
    if (!otpRecord) throw new BadRequestError(ERROR_MESSAGES.OTP_INVALID);
    OTPGenerator.verify(otp, otpRecord.code, otpRecord.expires_at);
    
    // Update user to verified
    await this.userRepository.update(user.id, { is_verified: true });
    await this.otpRepository.delete(otpRecord.id);

    // Generate tokens for automatic login
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    return { user, accessToken, refreshToken };
  }


  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    const otpRecord = await this.otpRepository.findLatest(user.id, "reset_password");
    if (!otpRecord) throw new BadRequestError("Reset link has expired or is invalid.");
    
    // VERIFY TOKEN: Same method as OTP verification
    OTPGenerator.verify(token, otpRecord.code, otpRecord.expires_at);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { password: hashedPassword });
    await this.otpRepository.delete(otpRecord.id);
  }

  async googleLogin(token: string, role?: string) {
    try {
      // Use the access token to fetch user info from Google
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
      const payload = (await response.json()) as { email?: string; name?: string };

      if (!response.ok || !payload.email) {
        logger.error("Google Token Verification Failed:", payload);
        throw new UnauthorizedError("Invalid Google token or expired");
      }

      const { email, name } = payload;
      let user = await this.userRepository.findByEmail(email);

      if (!user) {
        // If it's a new user, use the provided role or default to "user"
        const assignedRole = role === "provider" ? "provider" : "user";
        const status = assignedRole === "provider" ? "pending" : "approved";

        user = await this.userRepository.create({
          email,
          name: name || "Google User",
          role: assignedRole,
          is_verified: true,
          status
        });
      }

      if (user.isDeleted) throw new UnauthorizedError("Your account has been blocked.");
      // if (user.status === "rejected") throw new UnauthorizedError("Your account application has been rejected.");

      const { accessToken, refreshToken } = generateTokens(user.id, user.role);
      return { user, accessToken, refreshToken };
    } catch (error: unknown) {
      logger.error("Google Login Error:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
