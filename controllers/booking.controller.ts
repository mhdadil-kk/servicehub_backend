import { Request, Response } from "express";
import { IBookingService } from "../interfaces/services/IBookingService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { asyncHandler } from "../utils/async-handler";
import { BadRequestError } from "../utils/error";

export class BookingController {
  constructor(private _bookingService: IBookingService) {}

  getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
    const { providerId, date } = req.query as { providerId: string; date: string };
    if (!providerId || !date) throw new BadRequestError("Provider ID and Date are required");
    const slots = await this._bookingService.getAvailableSlots(providerId, date);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(slots));
  });

  createBooking = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const booking = await this._bookingService.createBooking(userId, req.body);
    res.status(HttpStatusCode.CREATED).json(createSuccessResponse(booking, "Booking created successfully"));
  });

  getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const bookings = await this._bookingService.getUserBookings(userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(bookings));
  });

  getProviderBookings = asyncHandler(async (req: Request, res: Response) => {
    const providerUserId = req.user!.id;
    const bookings = await this._bookingService.getProviderBookings(providerUserId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(bookings));
  });

  getBookingDetail = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const role = req.user!.role;
    const booking = await this._bookingService.getBookingDetail(bookingId, userId, role);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking));
  });

  acceptBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    const booking = await this._bookingService.acceptBooking(bookingId, providerUserId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking accepted"));
  });

  updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    const { status } = req.body;
    const booking = await this._bookingService.updateBookingStatus(bookingId, providerUserId, status);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, `Booking marked as ${status}`));
  });

  cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const role = req.user!.role;
    const { reason } = req.body;
    const booking = await this._bookingService.cancelBooking(bookingId, userId, role, reason);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking cancelled successfully"));
  });

  rescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const booking = await this._bookingService.rescheduleBooking(bookingId, userId, req.body);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Booking rescheduled successfully"));
  });

  providerRescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    const booking = await this._bookingService.providerRescheduleBooking(bookingId, providerUserId, req.body);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Reschedule request sent to customer"));
  });

  customerAcceptReschedule = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const booking = await this._bookingService.customerAcceptReschedule(bookingId, userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Rescheduled time accepted"));
  });

  customerRejectReschedule = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const booking = await this._bookingService.customerRejectReschedule(bookingId, userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Rescheduled time rejected and booking cancelled"));
  });

  generateArrivalOtp = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    await this._bookingService.generateArrivalOtp(bookingId, providerUserId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Arrival OTP sent to customer"));
  });

  verifyArrivalOtp = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    const { otp } = req.body;
    const booking = await this._bookingService.verifyArrivalOtp(bookingId, providerUserId, otp);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Arrival verified, job started"));
  });

  generateCompletionOtp = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    await this._bookingService.generateCompletionOtp(bookingId, providerUserId, req.body);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Completion OTP and invoice sent to customer"));
  });

  verifyCompletionOtp = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const providerUserId = req.user!.id;
    const { otp } = req.body;
    const booking = await this._bookingService.verifyCompletionOtp(bookingId, providerUserId, otp);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking, "Job completed, awaiting final payment"));
  });
}