import { Router } from "express";
import { bookingService } from "../di/container"; 
import { BookingController } from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  CreateBookingSchema,
  CancelBookingSchema,
  RescheduleBookingSchema,
  UpdateBookingStatusSchema,
  GenerateCompletionOtpSchema
} from "../dtos/booking.dto";

const router = Router();
const bookingController = new BookingController(bookingService);

router.get("/slots", bookingController.getAvailableSlots);
router.use(authMiddleware);
router.get("/detail/:bookingId", bookingController.getBookingDetail);

router.post(
  "/",
  roleMiddleware("user"),
  validate(CreateBookingSchema),
  bookingController.createBooking
);
router.get(
  "/my-bookings",
  roleMiddleware("user"),
  bookingController.getUserBookings
);
router.post(
  "/:bookingId/cancel",
  roleMiddleware("user"),
  validate(CancelBookingSchema),
  bookingController.cancelBooking
);
router.post(
  "/:bookingId/reschedule",
  roleMiddleware("user"),
  validate(RescheduleBookingSchema),
  bookingController.rescheduleBooking
);
router.post(
  "/:bookingId/accept-reschedule",
  roleMiddleware("user"),
  bookingController.customerAcceptReschedule
);
router.post(
  "/:bookingId/reject-reschedule",
  roleMiddleware("user"),
  bookingController.customerRejectReschedule
);

router.get(
  "/provider/my-jobs",
  roleMiddleware("provider"),
  bookingController.getProviderBookings
);
router.post(
  "/:bookingId/accept",
  roleMiddleware("provider"),
  bookingController.acceptBooking
);
router.put(
  "/:bookingId/status",
  roleMiddleware("provider"),
  validate(UpdateBookingStatusSchema),
  bookingController.updateBookingStatus
);
router.post(
  "/:bookingId/provider-cancel",
  roleMiddleware("provider"),
  validate(CancelBookingSchema),
  bookingController.cancelBooking
);
router.post(
  "/:bookingId/provider-reschedule",
  roleMiddleware("provider"),
  validate(RescheduleBookingSchema),
  bookingController.providerRescheduleBooking
);
router.post(
  "/:bookingId/arrival-otp/generate",
  roleMiddleware("provider"),
  bookingController.generateArrivalOtp
);
router.post(
  "/:bookingId/arrival-otp/verify",
  roleMiddleware("provider"),
  bookingController.verifyArrivalOtp
);
router.post(
  "/:bookingId/completion-otp/generate",
  roleMiddleware("provider"),
  validate(GenerateCompletionOtpSchema),
  bookingController.generateCompletionOtp
);
router.post(
  "/:bookingId/completion-otp/verify",
  roleMiddleware("provider"),
  bookingController.verifyCompletionOtp
);

export default router;