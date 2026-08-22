import { AvailableSlotDTO, DetailedBookingResponseDTO } from "../../dtos/booking.dto";
import { IBooking } from "../../types/booking.types";

export interface CreateBookingInput {
  providerId: string;
  serviceId: string;
  addressId: string;
  date: string;
  slot: { start: string; end: string };
  notes?: string;
}

export interface IBookingService {
  getAvailableSlots(providerId: string, date: string): Promise<AvailableSlotDTO[]>;
  createBooking(userId: string, data: CreateBookingInput): Promise<DetailedBookingResponseDTO>;
  getUserBookings(userId: string): Promise<DetailedBookingResponseDTO[]>;
  getProviderBookings(providerUserId: string): Promise<DetailedBookingResponseDTO[]>;
  getBookingDetail(bookingId: string, userId: string, role: string): Promise<DetailedBookingResponseDTO>;
  acceptBooking(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO>;
  updateBookingStatus(bookingId: string, providerUserId: string, status: IBooking["status"]): Promise<DetailedBookingResponseDTO>;
  cancelBooking(bookingId: string, userId: string, role: string, reason?: string): Promise<DetailedBookingResponseDTO>;
  rescheduleBooking(bookingId: string, userId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO>;
  providerRescheduleBooking(bookingId: string, providerUserId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO>;
  customerAcceptReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO>;
  customerRejectReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO>;
  generateArrivalOtp(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO>;
  verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO>;
  generateCompletionOtp(
    bookingId: string,
    providerUserId: string,
    invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] }
  ): Promise<DetailedBookingResponseDTO>;
  verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO>;
}