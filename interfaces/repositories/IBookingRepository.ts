import { IBooking } from "../../types/booking.types";
import mongoose from "mongoose";

export interface AvailableSlot {
  id: string;
  start: string;
  end: string;
  isBooked: boolean;
}

export interface IBookingRepository {
  findById(id: string): Promise<IBooking | null>;
  create(data: Partial<IBooking>): Promise<IBooking>;
  countByUserId(userId: string, statuses?: string[]): Promise<number>;
  countByProviderId(providerId: string, statuses?: string[]): Promise<number>;
  findRecentByUserId(userId: string, limit?: number): Promise<IBooking[]>;
  findRecentByProviderId(providerId: string, limit?: number): Promise<IBooking[]>;
  findByIdWithService(id: string): Promise<IBooking | null>;
  findByIdWithProviderUser(id: string): Promise<IBooking | null>;
  findByIdWithProviderAndUser(id: string): Promise<IBooking | null>;
  updateStripeSession(id: string, stripeSessionId: string): Promise<IBooking | null>;
  confirmBookingFeePaid(id: string): Promise<IBooking | null>;
  confirmFinalPaymentPaid(id: string): Promise<IBooking | null>;
  findActiveByProviderAndDate(
    providerId: string,
    date: string,
    statuses: string[]
  ): Promise<IBooking[]>;
  findByUserIdPopulated(userId: string): Promise<IBooking[]>;
  findByProviderIdPopulated(providerId: string): Promise<IBooking[]>;
  findOneForUser(bookingId: string, userId: string): Promise<IBooking | null>;
  findOneForProvider(bookingId: string, providerProfileId: string): Promise<IBooking | null>;
  findDetailForUser(bookingId: string, userId: string): Promise<IBooking | null>;
  findDetailForProvider(bookingId: string, providerProfileId: string): Promise<IBooking | null>;
  findSlotBooking(providerId: string, date: string, start: string): Promise<IBooking | null>;
  updateStatus(bookingId: string, data: Partial<IBooking>): Promise<IBooking | null>;
  findAllWithFilters(query: mongoose.FilterQuery<IBooking>, sort: Record<string, mongoose.SortOrder>, skip: number, limit: number): Promise<IBooking[]>;
  countByFilter(query: mongoose.FilterQuery<IBooking>): Promise<number>;
  getServiceBookingTrends(dateFilter?: mongoose.FilterQuery<IBooking>): Promise<{ _id: string; count: number }[]>;
  findByIdPopulated(id: string): Promise<IBooking | null>;
  getPlatformRevenueByMonth(dateFilter?: mongoose.FilterQuery<IBooking>): Promise<{ month: string; year: number; count: number }[]>;
}