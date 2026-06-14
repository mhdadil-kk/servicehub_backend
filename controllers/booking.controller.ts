import { Request, Response, NextFunction } from "express";
import { BookingService } from "../services/booking.service";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { BadRequestError } from "../utils/error";

export class BookingController {
  private _bookingService: BookingService;

  constructor() {
    this._bookingService = new BookingService();
  }

  getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { providerId, date } = req.query;

      if (!providerId || !date) {
        throw new BadRequestError("Provider ID and Date are required query parameters");
      }

      const slots = await this._bookingService.getAvailableSlots(
        providerId as string,
        date as string
      );

      res.status(HttpStatusCode.OK).json(createSuccessResponse(slots));
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const data = req.body;

      const booking = await this._bookingService.createBooking(userId, data);
      res.status(HttpStatusCode.CREATED).json(createSuccessResponse(booking, "Booking request created successfully"));
    } catch (error) {
      next(error);
    }
  };

  getUserBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const bookings = await this._bookingService.getUserBookings(userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(bookings));
    } catch (error) {
      next(error);
    }
  };

  getProviderBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const bookings = await this._bookingService.getProviderBookings(userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(bookings));
    } catch (error) {
      next(error);
    }
  };

  getBookingDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const { id } = req.params;

      const booking = await this._bookingService.getBookingDetail(id, userId, role);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking));
    } catch (error) {
      next(error);
    }
  };

  confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const booking = await this._bookingService.updateBookingStatus(id, userId, "confirmed");
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking confirmed successfully"));
    } catch (error) {
      next(error);
    }
  };

  completeBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const booking = await this._bookingService.updateBookingStatus(id, userId, "completed");
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking completed successfully"));
    } catch (error) {
      next(error);
    }
  };

  acceptBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const booking = await this._bookingService.acceptBooking(id, userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking accepted successfully. Customer has been notified to pay."));
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await this._bookingService.cancelBooking(id, userId, role, reason);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking cancelled successfully"));
    } catch (error) {
      next(error);
    }
  };

  rescheduleBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const data = req.body;

      const booking = await this._bookingService.rescheduleBooking(id, userId, data);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking rescheduled successfully"));
    } catch (error) {
      next(error);
    }
  };

  // --- OTP ENDPOINTS ---

  generateArrivalOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providerUserId = req.user.id;
      const { id } = req.params;
      const booking = await this._bookingService.generateArrivalOtp(id, providerUserId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Arrival OTP generated successfully"));
    } catch (error) {
      next(error);
    }
  };

  verifyArrivalOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providerUserId = req.user.id;
      const { id } = req.params;
      const { otp } = req.body;
      const booking = await this._bookingService.verifyArrivalOtp(id, providerUserId, otp);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Arrival OTP verified successfully. Job in progress."));
    } catch (error) {
      next(error);
    }
  };

  generateCompletionOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providerUserId = req.user.id;
      const { id } = req.params;
      const { invoiceData } = req.body; // { baseCharge, extraCharges }
      const booking = await this._bookingService.generateCompletionOtp(id, providerUserId, invoiceData);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Completion OTP generated successfully. Final Invoice saved."));
    } catch (error) {
      next(error);
    }
  };

  verifyCompletionOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providerUserId = req.user.id;
      const { id } = req.params;
      const { otp } = req.body;
      const booking = await this._bookingService.verifyCompletionOtp(id, providerUserId, otp);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Completion OTP verified successfully. Job completed."));
    } catch (error) {
      next(error);
    }
  };
}
