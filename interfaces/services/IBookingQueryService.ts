import { AvailableSlotDTO, DetailedBookingResponseDTO } from "../../dtos/booking.dto";

export interface IBookingQueryService {
  getAvailableSlots(providerId: string, dateStr: string): Promise<AvailableSlotDTO[]>;
  getUserBookings(userId: string): Promise<DetailedBookingResponseDTO[]>;
  getProviderBookings(providerUserId: string): Promise<DetailedBookingResponseDTO[]>;
  getBookingDetail(bookingId: string, userId: string, role: string): Promise<DetailedBookingResponseDTO>;
}
