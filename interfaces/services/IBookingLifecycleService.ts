import { DetailedBookingResponseDTO } from "../../dtos/booking.dto";
import { CreateBookingInput } from "./IBookingService";
import { IBooking } from "../../types/booking.types";

export interface IBookingLifecycleService {
  createBooking(userId: string, data: CreateBookingInput): Promise<DetailedBookingResponseDTO>;
  acceptBooking(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO>;
  updateBookingStatus(bookingId: string, providerUserId: string, status: IBooking["status"]): Promise<DetailedBookingResponseDTO>;
  cancelBooking(bookingId: string, userId: string, role: string, reason?: string): Promise<DetailedBookingResponseDTO>;
  rescheduleBooking(bookingId: string, userId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO>;
  providerRescheduleBooking(bookingId: string, providerUserId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO>;
  customerAcceptReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO>;
  customerRejectReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO>;
}
