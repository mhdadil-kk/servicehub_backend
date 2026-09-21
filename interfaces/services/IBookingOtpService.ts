import { DetailedBookingResponseDTO } from "../../dtos/booking.dto";

export interface IBookingOtpService {
  generateArrivalOtp(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO>;
  verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO>;
  generateCompletionOtp(
    bookingId: string,
    providerUserId: string,
    invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] }
  ): Promise<DetailedBookingResponseDTO>;
  verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO>;
}
