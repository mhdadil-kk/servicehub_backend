import { IBookingService, CreateBookingInput } from "../interfaces/services/IBookingService";
import { IBookingQueryService } from "../interfaces/services/IBookingQueryService";
import { IBookingLifecycleService } from "../interfaces/services/IBookingLifecycleService";
import { IBookingOtpService } from "../interfaces/services/IBookingOtpService";
import { AvailableSlotDTO, DetailedBookingResponseDTO } from "../dtos/booking.dto";
import { IBooking } from "../types/booking.types";


export class BookingService implements IBookingService {
  constructor(
    private _queryService: IBookingQueryService,
    private _lifecycleService: IBookingLifecycleService,
    private _otpService: IBookingOtpService
  ) {}

  getAvailableSlots(providerId: string, dateStr: string): Promise<AvailableSlotDTO[]> {
    return this._queryService.getAvailableSlots(providerId, dateStr);
  }

  getUserBookings(userId: string): Promise<DetailedBookingResponseDTO[]> {
    return this._queryService.getUserBookings(userId);
  }

  getProviderBookings(providerUserId: string): Promise<DetailedBookingResponseDTO[]> {
    return this._queryService.getProviderBookings(providerUserId);
  }

  getBookingDetail(bookingId: string, userId: string, role: string): Promise<DetailedBookingResponseDTO> {
    return this._queryService.getBookingDetail(bookingId, userId, role);
  }

  createBooking(userId: string, data: CreateBookingInput): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.createBooking(userId, data);
  }

  acceptBooking(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.acceptBooking(bookingId, providerUserId);
  }

  updateBookingStatus(bookingId: string, providerUserId: string, status: IBooking["status"]): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.updateBookingStatus(bookingId, providerUserId, status);
  }

  cancelBooking(bookingId: string, userId: string, role: string, reason?: string): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.cancelBooking(bookingId, userId, role, reason);
  }

  rescheduleBooking(bookingId: string, userId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.rescheduleBooking(bookingId, userId, data);
  }

  providerRescheduleBooking(bookingId: string, providerUserId: string, data: Partial<CreateBookingInput>): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.providerRescheduleBooking(bookingId, providerUserId, data);
  }

  customerAcceptReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.customerAcceptReschedule(bookingId, userId);
  }

  customerRejectReschedule(bookingId: string, userId: string): Promise<DetailedBookingResponseDTO> {
    return this._lifecycleService.customerRejectReschedule(bookingId, userId);
  }

  generateArrivalOtp(bookingId: string, providerUserId: string): Promise<DetailedBookingResponseDTO> {
    return this._otpService.generateArrivalOtp(bookingId, providerUserId);
  }

  verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO> {
    return this._otpService.verifyArrivalOtp(bookingId, providerUserId, otp);
  }

  generateCompletionOtp(
    bookingId: string,
    providerUserId: string,
    invoiceData: { baseCharge: number; extraCharges?: { description: string; amount: number }[] }
  ): Promise<DetailedBookingResponseDTO> {
    return this._otpService.generateCompletionOtp(bookingId, providerUserId, invoiceData);
  }

  verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<DetailedBookingResponseDTO> {
    return this._otpService.verifyCompletionOtp(bookingId, providerUserId, otp);
  }
}