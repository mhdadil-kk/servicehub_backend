import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IProviderAvailabilityRepository } from "../interfaces/repositories/IProviderAvailabilityRepository";
import { IConversationRepository } from "../interfaces/repositories/IConversationRepository";
import { IMessageRepository } from "../interfaces/repositories/IMessageRepository";
import { INotificationService } from "../interfaces/services/INotificationService";
import { IWalletService } from "../interfaces/services/IWalletService";
import { IMailer } from "../utils/mailer";
import { IBookingService, CreateBookingInput } from "../interfaces/services/IBookingService";
import { IBooking } from "../types/booking.types";
import { IProviderProfile } from "../types/providerProfile.types";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { AvailableSlotDTO, DetailedBookingResponseDTO } from "../dtos/booking.dto";
import { BookingMapper } from "../mappers/booking.mapper";
import mongoose from "mongoose";
import { ACTIVE_SLOT_BOOKING_STATUSES } from "../constants/statuses";
import { logger } from "../utils/logger";

export class BookingService implements IBookingService {
  constructor(
    private _bookingRepository: IBookingRepository,
    private _providerProfileRepository: IProviderProfileRepository,
    private _providerAvailabilityRepository: IProviderAvailabilityRepository,
    private _conversationRepository: IConversationRepository,
    private _messageRepository: IMessageRepository,
    private _notificationService: INotificationService,
    private _mailer: IMailer,
    private _walletService: IWalletService
  ) { }

  async getAvailableSlots(providerId: string, dateStr: string): Promise<AvailableSlotDTO[]> {
    const availability = await this._providerAvailabilityRepository.findByProviderId(providerId);
    if (!availability) return [];

    if (availability.startDate && dateStr < availability.startDate) return [];
    if (availability.endDate && dateStr > availability.endDate) return [];

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ] as const;

    const weekday = weekdays[new Date(`${dateStr}T00:00:00`).getDay()];

    let slots: { id?: string; start: string; end: string }[] = [];
    let isAvailable = false;

    const override = availability.overrides?.find((ov) => ov.date === dateStr);
    if (override) {
      isAvailable = override.isAvailable;
      slots = override.isAvailable ? override.slots : [];
    } else {
      const daySchedule = availability.weeklySchedule[weekday];
      if (daySchedule) {
        isAvailable = daySchedule.isAvailable;
        slots = daySchedule.isAvailable ? daySchedule.slots : [];
      }
    }

    if (!isAvailable || slots.length === 0) return [];

    const bookings = await this._bookingRepository.findActiveByProviderAndDate(
      providerId,
      dateStr,
      [...ACTIVE_SLOT_BOOKING_STATUSES]
    );

    return slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      isBooked: bookings.some(
        (b) => b.slot.start === slot.start && b.slot.end === slot.end
      ),
    }));
  }

  async createBooking(userId: string, data: CreateBookingInput): Promise<DetailedBookingResponseDTO> {
    const existing = await this._bookingRepository.findSlotBooking(data.providerId, data.date, data.slot.start);
    if (existing) throw new BadRequestError(ERROR_MESSAGES.SLOT_ALREADY_BOOKED);

    const booking = await this._bookingRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      providerId: new mongoose.Types.ObjectId(data.providerId),
      serviceId: new mongoose.Types.ObjectId(data.serviceId),
      addressId: new mongoose.Types.ObjectId(data.addressId),
      date: data.date,
      slot: data.slot,
      status: "pending",
      notes: data.notes,
    });

    const bookingIdStr = booking._id?.toString() || "";
    const savedBooking = await this._bookingRepository.findByIdWithProviderAndUser(bookingIdStr);
    if (!savedBooking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const providerProfile = await this._providerProfileRepository.findById(data.providerId);
    if (providerProfile) {
      await this._notificationService.create({
        userId: providerProfile.userId.toString(),
        title: "New Booking Request",
        message: `You have received a new booking request for ${data.date} at ${data.slot.start}.`,
        type: "info",
        relatedId: savedBooking._id?.toString(),
      });

      const existingConversations =
        await this._conversationRepository.findDirectBetweenUsers(
          userId,
          providerProfile.userId.toString()
        );

      let conversationId: string;

      if (existingConversations.length === 0) {
        const newConvo =
          await this._conversationRepository.createForBooking(
            [userId, providerProfile.userId.toString()],
            bookingIdStr
          );

        conversationId = newConvo._id?.toString() ?? newConvo.id;
      } else {
        const conversation = existingConversations[0];

        conversationId =
          conversation._id?.toString() ?? conversation.id;

        await this._conversationRepository.attachBooking(
          conversationId,
          bookingIdStr
        );
      }

      await this._messageRepository.createBookingCardMessage({
        conversationId,
        bookingId: bookingIdStr,
        senderId: userId,
        senderRole: "user",
      });
    }

    return BookingMapper.toDetailedResponse(savedBooking)!;
  }

  async getUserBookings(userId: string): Promise<DetailedBookingResponseDTO[]> {
    const bookings = await this._bookingRepository.findByUserIdPopulated(userId);
    return bookings.map((b) => BookingMapper.toDetailedResponse(b)!);
  }

  async getProviderBookings(providerUserId: string): Promise<DetailedBookingResponseDTO[]> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const bookings = await this._bookingRepository.findByProviderIdPopulated(profile._id.toString());
    return bookings.map((b) => BookingMapper.toDetailedResponse(b)!);
  }

  async getBookingDetail(bookingId: string, userId: string, role: string): Promise<DetailedBookingResponseDTO> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (role === "admin") return BookingMapper.toDetailedResponse(booking)!;

    if (role === "user") {
      const customer = this.getPopulatedUser(booking);
      if (customer.id !== userId) throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED_BOOKING_ACCESS);
      return BookingMapper.toDetailedResponse(booking)!;
    }

    if (role === "provider") {
      const profile = await this.getProviderProfileOrThrow(userId);
      this.assertProviderOwnsBooking(booking, profile);
      return BookingMapper.toDetailedResponse(booking)!;
    }

    throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED_BOOKING_ACCESS);
  }

  async acceptBooking(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    if (booking.status !== "pending") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_PENDING);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, { status: "awaiting_payment" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    await this._notificationService.create({
      userId: customer.id,
      title: "Booking Accepted",
      message: `Your booking for ${booking.date} at ${booking.slot.start} has been accepted. Please make the advance payment.`,
      type: "success",
      relatedId: bookingId,
    });

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async updateBookingStatus(bookingId: string, providerUserId: string, status: IBooking["status"]): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    const updated = await this._bookingRepository.updateStatus(bookingId, { status });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async cancelBooking(bookingId: string, userId: string, role: string, reason?: string): Promise<DetailedBookingResponseDTO> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const nonCancellableStatuses = ["completed", "completed_pending_payment", "cancelled"];
    if (nonCancellableStatuses.includes(booking.status)) {
      throw new BadRequestError(ERROR_MESSAGES.CANNOT_CANCEL_COMPLETED);
    }

    const hoursUntil = this.hoursUntilBooking(booking.date, booking.slot.start);

    let refundAmount = 0;
    const advancePaid = booking.paymentStatus === "paid" || booking.paymentStatus === "fully_paid";

    if (role === "user") {
      const customer = this.getPopulatedUser(booking);
      if (customer.id !== userId) throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED_BOOKING_ACCESS);

      if (advancePaid) {
        if (hoursUntil >= 24) refundAmount = 100;
        else if (hoursUntil >= 12) refundAmount = 50;
      }
    } else if (role === "provider") {
      const profile = await this.getProviderProfileOrThrow(userId);
      this.assertProviderOwnsBooking(booking, profile);
      if (advancePaid) refundAmount = 100;
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "cancelled",
      cancelledBy: role as "user" | "provider",
      cancellationReason: reason,
      paymentStatus: refundAmount > 0 ? "failed" : booking.paymentStatus,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);

    if (refundAmount > 0) {
      await this._walletService.credit(
        customer.id,
        refundAmount,
        `Refund for cancelled booking #${bookingId.slice(-6)} (${refundAmount === 100 ? "Full" : "Partial"} refund)`
      );
    }

    const cancelledByLabel = role === "user" ? "customer" : "provider";
    let recipientUserId: string | undefined;

    if (role === "user") {
      const providerUser = this.getPopulatedProviderUser(booking);
      if (providerUser) {
        recipientUserId = providerUser.id;
      } else {
        const prov = booking.providerId;
        const providerProfileId = typeof prov === "object" && prov !== null && "_id" in prov
          ? String((prov as { _id: unknown })._id)
          : String(prov);
        const provProfile = await this._providerProfileRepository.findById(providerProfileId);
        if (provProfile?.userId) {
          recipientUserId = typeof provProfile.userId === "object" && provProfile.userId !== null && "_id" in provProfile.userId
            ? String((provProfile.userId as { _id: unknown })._id)
            : String(provProfile.userId);
        }
      }
    } else {
      recipientUserId = customer.id;
    }

    if (recipientUserId && recipientUserId !== "[object Object]") {
      try {
        await this._notificationService.create({
          userId: recipientUserId,
          title: "Booking Cancelled",
          message: `Booking for ${booking.date} at ${booking.slot.start} was cancelled by the ${cancelledByLabel}.${refundAmount > 0 ? ` A refund of Rs.${refundAmount} has been processed to the wallet.` : ""}`,
          type: "warning",
          relatedId: bookingId,
        });
      } catch (notifErr) {
        logger.warn(`Failed to send cancellation notification for booking ${bookingId}:`, notifErr);
      }
    }

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
  }

  async rescheduleBooking(bookingId: string, userId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    if (customer.id !== userId) throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED_BOOKING_ACCESS);

    if (booking.status === "in_progress" || booking.status === "completed" || booking.status === "completed_pending_payment") {
      throw new BadRequestError(ERROR_MESSAGES.CANNOT_RESCHEDULE_IN_PROGRESS);
    }

    const hoursUntil = this.hoursUntilBooking(booking.date, booking.slot.start);
    if (hoursUntil < 4) throw new BadRequestError(ERROR_MESSAGES.RESCHEDULE_TOO_LATE);

    const newDate = data.date || booking.date;
    const newSlot = data.slot || booking.slot;

    const prov = booking.providerId;
    const providerProfileId = typeof prov === "object" && prov !== null && "userId" in prov
      ? prov._id.toString()
      : String(prov);

    const existing = await this._bookingRepository.findSlotBooking(
      providerProfileId,
      newDate,
      newSlot.start
    );
    if (existing && existing._id?.toString() !== bookingId) {
      throw new BadRequestError(ERROR_MESSAGES.SLOT_ALREADY_BOOKED);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      date: newDate,
      slot: newSlot,
      addressId: data.addressId ? new mongoose.Types.ObjectId(data.addressId) : booking.addressId,
      notes: data.notes !== undefined ? data.notes : booking.notes,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const provProfile = await this._providerProfileRepository.findById(providerProfileId);
    if (provProfile) {
      await this._notificationService.create({
        userId: provProfile.userId.toString(),
        title: "Booking Rescheduled",
        message: `Customer rescheduled booking to ${newDate} at ${newSlot.start}.`,
        type: "info",
        relatedId: bookingId,
      });
    }

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async providerRescheduleBooking(bookingId: string, providerUserId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    const existing = await this._bookingRepository.findSlotBooking(
      profile._id.toString(),
      data.date!,
      data.slot!.start
    );
    if (existing && existing._id?.toString() !== bookingId) {
      throw new BadRequestError("That slot is already booked");
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "awaiting_user_confirmation",
      date: data.date,
      slot: data.slot,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    await this._notificationService.create({
      userId: customer.id,
      title: "Reschedule Request",
      message: `The provider requested to reschedule your booking to ${data.date} at ${data.slot!.start}. Please accept or reject.`,
      type: "info",
      relatedId: bookingId,
    });

    return BookingMapper.toDetailedResponse(updated)!;
  }

  async customerAcceptReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    if (customer.id !== userId) throw new BadRequestError("Unauthorized");

    if (booking.status !== "awaiting_user_confirmation") throw new BadRequestError("Booking is not awaiting confirmation");

    const updated = await this._bookingRepository.updateStatus(bookingId, { status: "confirmed" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const provUser = this.getPopulatedProviderUser(booking);
    let provUserId = provUser?.id;
    if (!provUserId) {
      const prov = booking.providerId;
      const providerProfileId = typeof prov === "object" && prov !== null && "_id" in prov
        ? String((prov as { _id: unknown })._id)
        : String(prov);
      const provProfile = await this._providerProfileRepository.findById(providerProfileId);
      if (provProfile?.userId) {
        provUserId = typeof provProfile.userId === "object" && provProfile.userId !== null && "_id" in provProfile.userId
          ? String((provProfile.userId as { _id: unknown })._id)
          : String(provProfile.userId);
      }
    }

    if (provUserId && provUserId !== "[object Object]") {
      try {
        await this._notificationService.create({
          userId: provUserId,
          title: "Reschedule Accepted",
          message: `The customer accepted the new time: ${booking.date} at ${booking.slot.start}.`,
          type: "success",
          relatedId: bookingId,
        });
      } catch (notifErr) {
        logger.warn(`Failed to send reschedule accept notification for booking ${bookingId}:`, notifErr);
      }
    }

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
  }

  async customerRejectReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    if (customer.id !== userId) throw new BadRequestError("Unauthorized");

    if (booking.status !== "awaiting_user_confirmation") throw new BadRequestError("Booking is not awaiting confirmation");

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "cancelled",
      cancelledBy: "user",
      cancellationReason: "Customer rejected the rescheduled time",
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const provUser = this.getPopulatedProviderUser(booking);
    let provUserId = provUser?.id;
    if (!provUserId) {
      const prov = booking.providerId;
      const providerProfileId = typeof prov === "object" && prov !== null && "_id" in prov
        ? String((prov as { _id: unknown })._id)
        : String(prov);
      const provProfile = await this._providerProfileRepository.findById(providerProfileId);
      if (provProfile?.userId) {
        provUserId = typeof provProfile.userId === "object" && provProfile.userId !== null && "_id" in provProfile.userId
          ? String((provProfile.userId as { _id: unknown })._id)
          : String(provProfile.userId);
      }
    }

    if (provUserId && provUserId !== "[object Object]") {
      try {
        await this._notificationService.create({
          userId: provUserId,
          title: "Reschedule Rejected",
          message: `The customer rejected the new booking time. The booking has been cancelled.`,
          type: "warning",
          relatedId: bookingId,
        });
      } catch (notifErr) {
        logger.warn(`Failed to send reschedule reject notification for booking ${bookingId}:`, notifErr);
      }
    }

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
  }

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

    if (!invoiceData.baseCharge || invoiceData.baseCharge <= 0) {
      throw new BadRequestError(ERROR_MESSAGES.BASE_CHARGE_REQUIRED);
    }

    const totalExtra =
      invoiceData.extraCharges?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    const finalTotal = Number(invoiceData.baseCharge) + totalExtra;
    const otp = this.generateOtp();

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      finalInvoice: { baseCharge: invoiceData.baseCharge, extraCharges: invoiceData.extraCharges ?? [] },
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

  private hoursUntilBooking(date: string, start: string): number {
    const bookingDateTime = new Date(`${date}T${start}:00`);
    return (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
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

  private getPopulatedProviderUser(booking: IBooking): { id: string; email?: string } | null {
    const prov = booking.providerId;
    if (typeof prov === "object" && prov !== null && "userId" in prov) {
      const u = (prov as { userId: unknown }).userId;
      if (typeof u === "object" && u !== null && "_id" in u) {
        return {
          id: String((u as { _id: unknown })._id),
          email: "email" in u && typeof (u as { email?: unknown }).email === "string"
            ? (u as { email: string }).email
            : undefined,
        };
      }
      if (u) {
        return { id: String(u) };
      }
    }
    return null;
  }
}