import mongoose from "mongoose";
import { IBookingRepository, AvailableSlot } from "../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IProviderAvailabilityRepository } from "../interfaces/repositories/IProviderAvailabilityRepository";
import { IConversationRepository } from "../interfaces/repositories/IConversationRepository";
import { IMessageRepository } from "../interfaces/repositories/IMessageRepository";
import { INotificationService } from "../interfaces/services/INotificationService";
import { IMailer } from "../utils/mailer";
import { IBooking } from "../types/booking.types";
import { IProviderProfile } from "../types/providerProfile.types";
import { BadRequestError, NotFoundError, ForbiddenError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { ACTIVE_SLOT_BOOKING_STATUSES } from "../constants/statuses";
import { logger } from "../utils/logger";
import { IBookingService, CreateBookingInput } from "../interfaces/services/IBookingService";

export class BookingService implements IBookingService {
    private _bookingRepository: IBookingRepository;
  private _providerProfileRepository: IProviderProfileRepository;
  private _providerAvailabilityRepository: IProviderAvailabilityRepository;
  private _conversationRepository: IConversationRepository;
  private _messageRepository: IMessageRepository;
  private _notificationService: INotificationService;
  private _mailer: IMailer;
  constructor(
    bookingRepository: IBookingRepository,
    providerProfileRepository: IProviderProfileRepository,
    providerAvailabilityRepository: IProviderAvailabilityRepository,
    conversationRepository: IConversationRepository,
    messageRepository: IMessageRepository,
    notificationService: INotificationService,
    mailer: IMailer
  ) {
    this._bookingRepository = bookingRepository;
    this._providerProfileRepository = providerProfileRepository;
    this._providerAvailabilityRepository = providerAvailabilityRepository;
    this._conversationRepository = conversationRepository;
    this._messageRepository = messageRepository;
    this._notificationService = notificationService;
    this._mailer = mailer;
}

  async getAvailableSlots(providerProfileId: string, dateStr: string): Promise<AvailableSlot[]> {
    const availability = await this._providerAvailabilityRepository.findByProviderId(providerProfileId);
    if (!availability) return [];

    if (availability.startDate && dateStr < availability.startDate) return [];
    if (availability.endDate && dateStr > availability.endDate) return [];

    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekday = weekdays[new Date(dateStr).getDay()];

    let slots: { id: string; start: string; end: string }[] = [];
    let isAvailable = false;

    const override = availability.overrides.find((ov) => ov.date === dateStr);
    if (override) {
      isAvailable = override.isAvailable;
      slots = override.isAvailable ? override.slots : [];
    } else {
      const daySchedule = availability.weeklySchedule[weekday as keyof typeof availability.weeklySchedule];
      if (daySchedule) {
        isAvailable = daySchedule.isAvailable;
        slots = daySchedule.isAvailable ? daySchedule.slots : [];
      }
    }

    if (!isAvailable || slots.length === 0) return [];

    const activeBookings = await this._bookingRepository.findActiveByProviderAndDate(
      providerProfileId,
      dateStr,
      [...ACTIVE_SLOT_BOOKING_STATUSES]
    );

    return slots.map((slot) => ({
      id: slot.id,
      start: slot.start,
      end: slot.end,
      isBooked: activeBookings.some(
        (b) => b.slot.start === slot.start && b.slot.end === slot.end
      ),
    }));
  }

  async createBooking(userId: string, data: CreateBookingInput): Promise<IBooking> {
    const { providerId, serviceId, addressId, date, slot, notes, rescheduledFrom } = data;

    if (!providerId || !serviceId || !addressId || !date || !slot?.start || !slot?.end) {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_DETAILS_REQUIRED);
    }

    const availableSlots = await this.getAvailableSlots(providerId, date);
    const matchingSlot = availableSlots.find((s) => s.start === slot.start && s.end === slot.end);

    if (!matchingSlot) throw new BadRequestError(ERROR_MESSAGES.SLOT_NOT_AVAILABLE);
    if (matchingSlot.isBooked) throw new BadRequestError(ERROR_MESSAGES.SLOT_ALREADY_BOOKED);

    const savedBooking = await this._bookingRepository.create({
      userId,
      providerId,
      serviceId,
      addressId,
      date,
      slot,
      notes,
      rescheduledFrom,
      status: "pending",
    } as unknown as Partial<IBooking>);

    try {
      const provProfile = await this._providerProfileRepository.findById(providerId);
      if (provProfile) {
        const providerUserId = provProfile.userId.toString();
        let conversation = await this._conversationRepository.findByParticipants([userId, providerUserId]);

        if (!conversation) {
          conversation = await this._conversationRepository.createForBooking(
            [userId, providerUserId],
            savedBooking._id.toString()
          );
        } else {
          await this._conversationRepository.attachBooking(
            conversation._id.toString(),
            savedBooking._id.toString()
          );
        }

        await this._messageRepository.createBookingCardMessage({
          conversationId: conversation._id.toString(),
          bookingId: savedBooking._id.toString(),
          senderId: userId,
          senderRole: "user",
        });

        await this._notificationService.create({
          userId: providerUserId,
          title: "New Booking Request",
          message: `You have received a new booking request for ${date} at ${slot.start}.`,
          type: "info",
          relatedId: savedBooking._id.toString(),
        });
      }
    } catch (e) {
      logger.warn(`Failed to bootstrap chat/notification for booking ${savedBooking._id}: ${e}`);
    }

    return savedBooking;
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    return this._bookingRepository.findByUserIdPopulated(userId);
  }

  async getProviderBookings(providerUserId: string): Promise<IBooking[]> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    return this._bookingRepository.findByProviderIdPopulated(profile._id.toString());
  }

  async getBookingDetail(bookingId: string, userId: string, role: string): Promise<IBooking> {
    let booking: IBooking | null = null;

    if (role === "user") {
      booking = await this._bookingRepository.findDetailForUser(bookingId, userId);
    } else if (role === "provider") {
      const profile = await this.getProviderProfileOrThrow(userId);
      booking = await this._bookingRepository.findDetailForProvider(bookingId, profile._id.toString());
    }

    if (!booking) {
      throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
    }

    return booking;
  }

  async acceptBooking(bookingId: string, providerUserId: string): Promise<IBooking> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findOneForProvider(bookingId, profile._id.toString());
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (booking.status !== "pending") {
      throw new BadRequestError(ERROR_MESSAGES.ONLY_PENDING_CAN_ACCEPT);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, { status: "awaiting_payment" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    await this._notificationService.create({
      userId: booking.userId.toString(),
      title: "Booking Accepted!",
      message: "Provider accepted! Pay the ₹100 booking fee to confirm your slot.",
      type: "success",
      relatedId: bookingId,
    });

    return updated;
  }

  async updateBookingStatus(
    bookingId: string,
    providerUserId: string,
    status: "confirmed" | "completed" | "cancelled"
  ): Promise<IBooking> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findOneForProvider(bookingId, profile._id.toString());
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (status === "completed" && booking.status !== "confirmed") {
      throw new BadRequestError(ERROR_MESSAGES.ONLY_CONFIRMED_CAN_COMPLETE);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, { status });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (status === "confirmed") {
      await this._notificationService.create({
        userId: booking.userId.toString(),
        title: "Booking Confirmed!",
        message: `Your booking for ${booking.date} at ${booking.slot.start} has been confirmed.`,
        type: "success",
        relatedId: bookingId,
      });
    } else if (status === "cancelled") {
      await this._notificationService.create({
        userId: booking.userId.toString(),
        title: "Booking Cancelled",
        message: `Your booking for ${booking.date} has been cancelled by the provider.`,
        type: "warning",
        relatedId: bookingId,
      });
    }

    return updated;
  }

  async cancelBooking(bookingId: string, userId: string, role: string, reason: string): Promise<IBooking> {
    let booking: IBooking | null = null;

    if (role === "user") {
      booking = await this._bookingRepository.findOneForUser(bookingId, userId);
    } else {
      const profile = await this.getProviderProfileOrThrow(userId);
      booking = await this._bookingRepository.findOneForProvider(bookingId, profile._id.toString());
    }

    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new BadRequestError(`${ERROR_MESSAGES.CANNOT_CANCEL_BOOKING} Current status: ${booking.status}`);
    }

    if (this.hoursUntilBooking(booking.date, booking.slot.start) < 2) {
      throw new BadRequestError(ERROR_MESSAGES.CANCEL_WITHIN_2_HOURS);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "cancelled",
      cancelledBy: role === "user" ? "user" : "provider",
      cancellationReason: reason || "No reason provided",
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (role === "user") {
      const provProfile = await this._providerProfileRepository.findById(booking.providerId.toString());
      if (provProfile) {
        await this._notificationService.create({
          userId: provProfile.userId.toString(),
          title: "Booking Cancelled by Customer",
          message: `A customer cancelled their booking for ${booking.date} at ${booking.slot.start}.`,
          type: "warning",
          relatedId: bookingId,
        });
      }
    } else {
      await this._notificationService.create({
        userId: booking.userId.toString(),
        title: "Booking Cancelled by Provider",
        message: `Your provider cancelled the booking for ${booking.date}. Reason: ${reason || "No reason provided"}.`,
        type: "warning",
        relatedId: bookingId,
      });
    }

    return updated;
  }

  async rescheduleBooking(
    bookingId: string,
    userId: string,
    data: Partial<CreateBookingInput>
  ): Promise<IBooking> {
    const originalBooking = await this._bookingRepository.findOneForUser(bookingId, userId);
    if (!originalBooking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (originalBooking.status === "cancelled" || originalBooking.status === "completed") {
      throw new BadRequestError(`${ERROR_MESSAGES.CANNOT_RESCHEDULE_BOOKING} Current status: ${originalBooking.status}`);
    }

    if (this.hoursUntilBooking(originalBooking.date, originalBooking.slot.start) < 2) {
      throw new BadRequestError(ERROR_MESSAGES.RESCHEDULE_WITHIN_2_HOURS);
    }

    await this._bookingRepository.updateStatus(bookingId, {
      status: "cancelled",
      cancelledBy: "user",
      cancellationReason: "Rescheduled by customer",
    });

    return this.createBooking(userId, {
      providerId: originalBooking.providerId.toString(),
      serviceId: originalBooking.serviceId.toString(),
      addressId: data.addressId || originalBooking.addressId.toString(),
      date: data.date!,
      slot: data.slot!,
      notes: data.notes || originalBooking.notes,
      rescheduledFrom: originalBooking._id.toString(),
    });
  }

  async providerRescheduleBooking(
    bookingId: string,
    providerUserId: string,
    data: Partial<CreateBookingInput>
  ): Promise<IBooking> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const originalBooking = await this._bookingRepository.findOneForProvider(bookingId, profile._id.toString());
    
    if (!originalBooking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (originalBooking.status === "cancelled" || originalBooking.status === "completed") {
      throw new BadRequestError(`${ERROR_MESSAGES.CANNOT_RESCHEDULE_BOOKING} Current status: ${originalBooking.status}`);
    }

    if (this.hoursUntilBooking(originalBooking.date, originalBooking.slot.start) < 2) {
      throw new BadRequestError(ERROR_MESSAGES.RESCHEDULE_WITHIN_2_HOURS);
    }

    await this._bookingRepository.updateStatus(bookingId, {
      status: "cancelled",
      cancelledBy: "provider",
      cancellationReason: "Rescheduled by provider",
    });

    const newBooking = await this.createBooking(originalBooking.userId.toString(), {
      providerId: originalBooking.providerId.toString(),
      serviceId: originalBooking.serviceId.toString(),
      addressId: data.addressId || originalBooking.addressId.toString(),
      date: data.date!,
      slot: data.slot!,
      notes: data.notes || originalBooking.notes,
      rescheduledFrom: originalBooking._id.toString(),
    });

    await this._bookingRepository.updateStatus(newBooking._id.toString(), {
      status: "awaiting_user_confirmation",
    });
    newBooking.status = "awaiting_user_confirmation";

    await this._bookingRepository.updateStatus(bookingId, {
      rescheduledTo: newBooking._id,
    } as Partial<IBooking>);

    await this._notificationService.create({
      userId: originalBooking.userId.toString(),
      title: "Booking Rescheduled",
      message: `Your provider rescheduled the booking for ${data.date} at ${data.slot!.start}. Please accept or reject this new time.`,
      type: "warning",
      relatedId: newBooking._id.toString(),
    });

    return newBooking;
  }

  async customerAcceptReschedule(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
    if ((booking.userId as any)._id.toString() !== userId) throw new BadRequestError("Unauthorized");
    if (booking.status !== "awaiting_user_confirmation") throw new BadRequestError("Booking is not awaiting confirmation");

    const updated = await this._bookingRepository.updateStatus(bookingId, { status: "confirmed" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const provProfile = await this._providerProfileRepository.findById((booking.providerId as any)._id.toString());
    if (provProfile) {
      await this._notificationService.create({
        userId: provProfile.userId.toString(),
        title: "Reschedule Accepted",
        message: `The customer accepted the new booking time.`,
        type: "success",
        relatedId: bookingId,
      });
    }

    return updated;
  }

  async customerRejectReschedule(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
    if ((booking.userId as any)._id.toString() !== userId) throw new BadRequestError("Unauthorized");
    if (booking.status !== "awaiting_user_confirmation") throw new BadRequestError("Booking is not awaiting confirmation");

    const updated = await this._bookingRepository.updateStatus(bookingId, { 
      status: "cancelled",
      cancelledBy: "user",
      cancellationReason: "Customer rejected the rescheduled time"
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const provProfile = await this._providerProfileRepository.findById((booking.providerId as any)._id.toString());
    if (provProfile) {
      await this._notificationService.create({
        userId: provProfile.userId.toString(),
        title: "Reschedule Rejected",
        message: `The customer rejected the new booking time. The booking has been cancelled.`,
        type: "warning",
        relatedId: bookingId,
      });
    }

    return updated;
  }


  async generateArrivalOtp(bookingId: string, providerUserId: string): Promise<IBooking> {
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

    return updated;
  }

  async verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<IBooking> {
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

    return updated;
  }

  async generateCompletionOtp(
    bookingId: string,
    providerUserId: string,
    invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] }
  ): Promise<IBooking> {
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
      message: `The provider has marked the job as complete. Total: ₹${finalTotal}. Your Completion OTP is ${otp}.`,
      type: "otp",
      relatedId: bookingId,
    });

    if (customer.email) {
      await this._mailer.sendBookingOTP(
        customer.email,
        "Job Completed - Verification Code",
        `Your service provider has completed the job. The final invoice amount is ₹${finalTotal}.`,
        otp
      );
    }

    return updated;
  }

  async verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<IBooking> {
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

    return updated;
  }

  private async getProviderProfileOrThrow(providerUserId: string): Promise<IProviderProfile> {
    const profile = await this._providerProfileRepository.findByUserId(providerUserId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);
    return profile;
  }

  private assertProviderOwnsBooking(booking: any, profile: IProviderProfile): void {
    const bookingProviderId = booking.providerId && booking.providerId._id 
      ? booking.providerId._id.toString() 
      : booking.providerId?.toString();
      
    if (bookingProviderId !== profile._id.toString()) {
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
      const populated = userId as mongoose.Types.ObjectId & { email?: string };
      return { id: populated._id.toString(), email: populated.email };
    }
    return { id: String(userId) };
  }
}
