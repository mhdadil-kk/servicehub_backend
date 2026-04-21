import nodemailer from "nodemailer";
import { logger } from "./logger";

export interface IMailer {
  sendOTP(email: string, otp: string): Promise<void>;
  sendResetLink(email: string, token: string): Promise<void>;
}

export class Mailer implements IMailer {
  private transporter?: nodemailer.Transporter;
  private get frontendUrl() {
    return process.env.FRONTEND_URL || "http://localhost:5173";
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const smtpUser = process.env.SMTP_USER?.replace(/["']/g, "").trim();
    const smtpPass = process.env.SMTP_PASS?.replace(/["']/g, "").replace(/\s/g, "");

    if (!smtpUser || !smtpPass) {
      throw new Error('Missing SMTP credentials in .env');
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    return this.transporter;
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const transporter = this.getTransporter();
    try {
      await transporter.sendMail({
        from: `"ServiceHub Support" <${process.env.SMTP_USER?.replace(/["']/g, "")}>`,
        to: email,
        subject: "Your Verification Code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #1a1a1a; margin-bottom: 24px;">Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Hello,</p>
            <p style="color: #666; font-size: 16px;">Your 6-digit verification code is:</p>
            <div style="background: #f4f4f4; padding: 24px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; border-radius: 8px; margin: 24px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          </div>
        `,
      });
      logger.info(`OTP sent to ${email}`);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'EAUTH') {
        logger.error(`❌ Authentication Failed: Please check your Google App Password. Ensure 2FA is ON and your code in .env is correct (16 characters).`, error);
      } else {
        logger.error(`❌ Failed to send OTP to ${email}`, error);
      }
      throw error;
    }
  }

  async sendResetLink(email: string, token: string): Promise<void> {
    const transporter = this.getTransporter();
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}&email=${email}`;
    try {
      await transporter.sendMail({
        from: `"ServiceHub Support" <${process.env.SMTP_USER?.replace(/["']/g, "")}>`,
        to: email,
        subject: "Reset Your Password",
        text: `Click the link to reset your password: ${resetLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #1a1a1a; margin-bottom: 24px;">Reset Password</h2>
            <p style="color: #666; font-size: 16px;">Hello,</p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to secure your account:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background: #2563eb; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Securely Reset Password</a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">If you did not request this, you can safely ignore this email. The link is valid for 1 hour.</p>
          </div>
        `,
      });
      logger.info(`✅ Reset Link sent to ${email}`);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'EAUTH') {
        logger.error(`❌ Authentication Failed: Please verify your Google App Password settings.`, error);
      } else {
        logger.error(`❌ Failed to send Reset Link to ${email}`, error);
      }
      throw error;
    }
  }
}
