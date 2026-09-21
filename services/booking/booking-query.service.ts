import { IBookingRepository } from "../../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../../interfaces/repositories/IProviderProfileRepository";
import { IProviderAvailabilityRepository } from "../../interfaces/repositories/IProviderAvailabilityRepository";
import { IBookingQueryService } from "../../interfaces/services/IBookingQueryService";
import { IBooking } from "../../types/booking.types";
import { IProviderProfile } from "../../types/providerProfile.types";
import { NotFoundError, ForbiddenError } from "../../utils/error";
import { ERROR_MESSAGES } from "../../constants/messages";
import { AvailableSlotDTO, DetailedBookingResponseDTO } from "../../dtos/booking.dto";
import { BookingMapper } from "../../mappers/booking.mapper";
import mongoose from "mongoose";
import { ACTIVE_SLOT_BOOKING_STATUSES } from "../../constants/statuses";

export class BookingQueryService implements IBookingQueryService {
  constructor(
    private _bookingRepository: IBookingRepository,
    private _providerProfileRepository: IProviderProfileRepository,
    private _providerAvailabilityRepository: IProviderAvailabilityRepository
  ) {}

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
