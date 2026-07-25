import { Request, Response, NextFunction } from "express";
import { IBookingService } from "../interfaces/services/IBookingService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { BookingMapper } from "../mappers/booking.mapper";

export class BookingController {
  private  _bookingService: IBookingService;
  constructor(bookingService: IBookingService) {
    this._bookingService = bookingService;
  }

  getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { providerId, date } = req.query;
      const slots = await this._bookingService.getAvailableSlots(
        providerId as string,
        date as string
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(slots, SUCCESS_MESSAGES.SLOTS_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const booking = await this._bookingService.createBooking(userId, req.body);
      res.status(HttpStatusCode.CREATED).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_CREATED)
      );
    } catch (error) {
      next(error);
    }
  };

  getUserBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await this._bookingService.getUserBookings(req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toArrayResponse(bookings, true), SUCCESS_MESSAGES.BOOKINGS_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getProviderBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await this._bookingService.getProviderBookings(req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toArrayResponse(bookings, true), SUCCESS_MESSAGES.BOOKINGS_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getBookingDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.getBookingDetail(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_DETAIL_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  acceptBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.acceptBooking(req.params.id, req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_ACCEPTED)
      );
    } catch (error) {
      next(error);
    }
  };

  confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.updateBookingStatus(
        req.params.id,
        req.user!.id,
        "confirmed"
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_CONFIRMED)
      );
    } catch (error) {
      next(error);
    }
  };

  completeBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.updateBookingStatus(
        req.params.id,
        req.user!.id,
        "completed"
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_COMPLETED)
      );
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.cancelBooking(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body.reason
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_CANCELLED)
      );
    } catch (error) {
      next(error);
    }
  };

  rescheduleBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.rescheduleBooking(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_RESCHEDULED)
      );
    } catch (error) {
      next(error);
    }
  };

  providerRescheduleBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.providerRescheduleBooking(
        req.params.id,
        req.user!.id,
        req.body
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.BOOKING_RESCHEDULED)
      );
    } catch (error) {
      next(error);
    }
  };

  customerAcceptReschedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.customerAcceptReschedule(
        req.params.id,
        req.user!.id
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.RESCHEDULE_ACCEPTED)
      );
    } catch (error) {
      next(error);
    }
  };

  customerRejectReschedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.customerRejectReschedule(
        req.params.id,
        req.user!.id
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.RESCHEDULE_REJECTED)
      );
    } catch (error) {
      next(error);
    }
  };

  generateArrivalOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.generateArrivalOtp(req.params.id, req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.ARRIVAL_OTP_GENERATED)
      );
    } catch (error) {
      next(error);
    }
  };

  verifyArrivalOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.verifyArrivalOtp(
        req.params.id,
        req.user!.id,
        req.body.otp
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.ARRIVAL_OTP_VERIFIED)
      );
    } catch (error) {
      next(error);
    }
  };

  generateCompletionOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.generateCompletionOtp(
        req.params.id,
        req.user!.id,
        req.body.invoiceData
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.COMPLETION_OTP_GENERATED)
      );
    } catch (error) {
      next(error);
    }
  };

  verifyCompletionOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await this._bookingService.verifyCompletionOtp(
        req.params.id,
        req.user!.id,
        req.body.otp
      );
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(BookingMapper.toDetailedResponse(booking), SUCCESS_MESSAGES.COMPLETION_OTP_VERIFIED)
      );
    } catch (error) {
      next(error);
    }
  };
}