import { IBookingRepository } from "../../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../../interfaces/repositories/IProviderProfileRepository";
import { INotificationService } from "../../interfaces/services/INotificationService";
import { IMailer } from "../../utils/mailer";
import { IBookingOtpService } from "../../interfaces/services/IBookingOtpService";
import { IBooking } from "../../types/booking.types";
import { IProviderProfile } from "../../types/providerProfile.types";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../utils/error";
import { ERROR_MESSAGES } from "../../constants/messages";
import { DetailedBookingResponseDTO } from "../../dtos/booking.dto";
import { BookingMapper } from "../../mappers/booking.mapper";
import mongoose from "mongoose";

export class BookingOtpService implements IBookingOtpService {
  constructor(
    private _bookingRepository: IBookingRepository,
    private _providerProfileRepository: IProviderProfileRepository,
    private _notificationService: INotificationService,
    private _mailer: IMailer
  ) {}

  async generateArrivalOtp(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    if (booking.status !== "confirmed") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_CONFIRMED);
    }

    const otp = this.generateOtp();
    const updated = await this._bookingRepository.updateStatus(bookingId, { arrivalOtp: otp });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    await this._notificationService.create({
      userId: customer.id,
      title: "Provider Arrived",
      message: `Your provider has arrived! Your Arrival OTP is ${otp}.`,
      type: "otp",
      relatedId: bookingId,
    });

    if (customer.email) {
      await this._mailer.sendBookingOTP(
        customer.email,
        "Provider Arrived - Verification Code",
        "Your service provider has arrived at the location.",
        otp
      );
    }

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    if (booking.status !== "confirmed") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_CONFIRMED);
    }

    if (!booking.arrivalOtp || booking.arrivalOtp !== otp) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_ARRIVAL_OTP);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "in_progress",
      arrivalOtp: undefined,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async generateCompletionOtp(
    bookingId: string,
    providerUserId: string,
    invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] }
  ): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    if (booking.status !== "in_progress") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_IN_PROGRESS);
    }

    const resolvedInvoice = (invoiceData && typeof invoiceData === "object" && "invoiceData" in invoiceData)
      ? (invoiceData as { invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] } }).invoiceData
      : invoiceData;

    const baseCharge = Number(resolvedInvoice?.baseCharge);
    if (!baseCharge || baseCharge <= 0) {
      throw new BadRequestError(ERROR_MESSAGES.BASE_CHARGE_REQUIRED);
    }

    const totalExtra =
      resolvedInvoice.extraCharges?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    const finalTotal = baseCharge + totalExtra;
    const otp = this.generateOtp();

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      finalInvoice: { baseCharge, extraCharges: resolvedInvoice.extraCharges ?? [] },
      totalAmount: finalTotal,
      completionOtp: otp,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    await this._notificationService.create({
      userId: customer.id,
      title: "Job Completed - Final Invoice",
      message: `The provider has marked the job as complete. Total: Rs.${finalTotal}. Your Completion OTP is ${otp}.`,
      type: "otp",
      relatedId: bookingId,
    });

    if (customer.email) {
      await this._mailer.sendBookingOTP(
        customer.email,
        "Job Completed - Verification Code",
        `Your service provider has completed the job. The final invoice amount is Rs.${finalTotal}.`,
        otp
      );
    }

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    if (booking.status !== "in_progress") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_IN_PROGRESS);
    }

    if (!booking.completionOtp || booking.completionOtp !== otp) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_COMPLETION_OTP);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "completed_pending_payment",
      completionOtp: undefined,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    return BookingMapper.toDetailedResponse(updated)!;
  }

  private async getProviderProfileOrThrow(providerUserId: string): Promise<IProviderProfile> {
    const profile = await this._providerProfileRepository.findByUserId(providerUserId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);
    return profile;
  }

  private assertProviderOwnsBooking(booking: IBooking, profile: IProviderProfile): void {
    const prov = booking.providerId;
    const bookingProviderId = typeof prov === "object" && prov !== null && "_id" in prov
      ? String((prov as { _id: unknown })._id)
      : String(prov);

    const profileId = typeof profile._id === "object" && profile._id !== null && "_id" in profile._id
      ? String((profile._id as { _id: unknown })._id)
      : String(profile._id);

    if (bookingProviderId !== profileId) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED_PROVIDER_BOOKING);
    }
  }

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private getPopulatedUser(booking: IBooking): { id: string; email?: string } {
    const userId = booking.userId;
    if (userId instanceof mongoose.Types.ObjectId) {
      return { id: userId.toString() };
    }
    if (typeof userId === "object" && userId !== null && "_id" in userId) {
      return { id: userId._id.toString(), email: userId.email };
    }
    return { id: String(userId) };
  }
}
