import { IBookingRepository } from "../../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../../interfaces/repositories/IProviderProfileRepository";
import { IConversationRepository } from "../../interfaces/repositories/IConversationRepository";
import { IMessageRepository } from "../../interfaces/repositories/IMessageRepository";
import { INotificationService } from "../../interfaces/services/INotificationService";
import { IWalletService } from "../../interfaces/services/IWalletService";
import { IBookingLifecycleService } from "../../interfaces/services/IBookingLifecycleService";
import { CreateBookingInput } from "../../interfaces/services/IBookingService";
import { IBooking } from "../../types/booking.types";
import { IProviderProfile } from "../../types/providerProfile.types";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../utils/error";
import { ERROR_MESSAGES } from "../../constants/messages";
import { DetailedBookingResponseDTO } from "../../dtos/booking.dto";
import { BookingMapper } from "../../mappers/booking.mapper";
import mongoose from "mongoose";
import { logger } from "../../utils/logger";

export class BookingLifecycleService implements IBookingLifecycleService {
  constructor(
    private _bookingRepository: IBookingRepository,
    private _providerProfileRepository: IProviderProfileRepository,
    private _conversationRepository: IConversationRepository,
    private _messageRepository: IMessageRepository,
    private _notificationService: INotificationService,
    private _walletService: IWalletService
  ) {}

  async createBooking(userId: string, data: CreateBookingInput): Promise<DetailedBookingResponseDTO> {
    const existingBooking = await this._bookingRepository.findByProviderDateTime(
      data.providerId,
      data.date,
      data.slot.start
    );

    if (existingBooking) {
      throw new BadRequestError(ERROR_MESSAGES.SLOT_ALREADY_BOOKED);
    }

    const booking = await this._bookingRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      providerId: new mongoose.Types.ObjectId(data.providerId),
      serviceId: new mongoose.Types.ObjectId(data.serviceId),
      addressId: new mongoose.Types.ObjectId(data.addressId),
      date: data.date,
      slot: data.slot,
      notes: data.notes,
      status: "pending",
      paymentStatus: "pending",
    });

    const bookingIdStr = booking._id?.toString() || "";
    const savedBooking = await this._bookingRepository.findByIdWithProviderAndUser(bookingIdStr);
    if (!savedBooking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const providerProfile = await this._providerProfileRepository.findById(data.providerId);
    if (providerProfile) {
      try {
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
        if (existingConversations.length > 0) {
          const c = existingConversations[0];
          conversationId = c._id?.toString() || c.id;
          await this._conversationRepository.attachBooking(conversationId, bookingIdStr);
        } else {
          const newConv = await this._conversationRepository.createForBooking(
            [userId, providerProfile.userId.toString()],
            bookingIdStr
          );
          conversationId = newConv._id?.toString() || newConv.id;
        }

        await this._messageRepository.createBookingCardMessage({
          conversationId,
          bookingId: bookingIdStr,
          senderId: userId,
          senderRole: "user",
        });
      } catch (err) {
        logger.warn(`Failed to process notification/conversation for booking ${bookingIdStr}:`, err);
      }
    }

    return BookingMapper.toDetailedResponse(savedBooking)!;
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
    try {
      await this._notificationService.create({
        userId: customer.id,
        title: "Booking Accepted",
        message: `Your booking for ${booking.date} at ${booking.slot.start} has been accepted. Please make the advance payment.`,
        type: "success",
        relatedId: bookingId,
      });
    } catch (notifErr) {
      logger.warn(`Failed to send accept notification for booking ${bookingId}:`, notifErr);
    }

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
  }

  async updateBookingStatus(bookingId: string, providerUserId: string, status: IBooking["status"]): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    const updated = await this._bookingRepository.updateStatus(bookingId, { status });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
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

    if (booking.status !== "confirmed") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_CONFIRMED);
    }

    const newDate = data.date || booking.date;
    const newSlot = data.slot || booking.slot;

    const prov = booking.providerId;
    const providerProfileId = typeof prov === "object" && prov !== null && "_id" in prov
      ? String((prov as { _id: unknown })._id)
      : String(prov);

    const existing = await this._bookingRepository.findByProviderDateTime(
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
      try {
        await this._notificationService.create({
          userId: provProfile.userId.toString(),
          title: "Booking Rescheduled",
          message: `Customer rescheduled booking to ${newDate} at ${newSlot.start}.`,
          type: "info",
          relatedId: bookingId,
        });
      } catch (notifErr) {
        logger.warn(`Failed to send reschedule notification for booking ${bookingId}:`, notifErr);
      }
    }

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
  }

  async providerRescheduleBooking(bookingId: string, providerUserId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO> {
    const profile = await this.getProviderProfileOrThrow(providerUserId);
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    this.assertProviderOwnsBooking(booking, profile);

    if (booking.status !== "confirmed") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_NOT_CONFIRMED);
    }

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      status: "awaiting_user_confirmation",
      date: data.date,
      slot: data.slot,
    });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const customer = this.getPopulatedUser(booking);
    try {
      await this._notificationService.create({
        userId: customer.id,
        title: "Reschedule Request",
        message: `The provider requested to reschedule your booking to ${data.date} at ${data.slot!.start}. Please accept or reject.`,
        type: "info",
        relatedId: bookingId,
      });
    } catch (notifErr) {
      logger.warn(`Failed to send reschedule request notification for booking ${bookingId}:`, notifErr);
    }

    const populated = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    return BookingMapper.toDetailedResponse(populated || updated)!;
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
