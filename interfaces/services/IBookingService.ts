import { AvailableSlot } from "../repositories/IBookingRepository";
import { IBooking } from "../../types/booking.types";

export interface CreateBookingInput {
  providerId: string;
  serviceId: string;
  addressId: string;
  date: string;
  slot: { start: string; end: string };
  notes?: string;
  rescheduledFrom?: string;
}

export interface IBookingService {
  getAvailableSlots(providerProfileId: string, dateStr: string): Promise<AvailableSlot[]>;
  createBooking(userId: string, data: CreateBookingInput): Promise<IBooking>;
  getUserBookings(userId: string): Promise<IBooking[]>;
  getProviderBookings(providerUserId: string): Promise<IBooking[]>;
  getBookingDetail(bookingId: string, userId: string, role: string): Promise<IBooking>;
  acceptBooking(bookingId: string, providerUserId: string): Promise<IBooking>;
  updateBookingStatus(
    bookingId: string,
    providerUserId: string,
    status: "confirmed" | "completed" | "cancelled"
  ): Promise<IBooking>;
  cancelBooking(bookingId: string, userId: string, role: string, reason: string): Promise<IBooking>;
  rescheduleBooking(bookingId: string, userId: string, data: Partial<CreateBookingInput>): Promise<IBooking>;
  providerRescheduleBooking(bookingId: string, providerUserId: string, data: Partial<CreateBookingInput>): Promise<IBooking>;
  customerAcceptReschedule(bookingId: string, userId: string): Promise<IBooking>;
  customerRejectReschedule(bookingId: string, userId: string): Promise<IBooking>;
  generateArrivalOtp(bookingId: string, providerUserId: string): Promise<IBooking>;
  verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<IBooking>;
  generateCompletionOtp(
    bookingId: string,
    providerUserId: string,
    invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] }
  ): Promise<IBooking>;
  verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<IBooking>;
}
