import { Router } from "express";
import { bookingService } from "../di/container";
import { BookingController } from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { ROUTES } from "../constants/routes";
import {
  CreateBookingSchema,
  CancelBookingSchema,
  RescheduleBookingSchema,
  UpdateBookingStatusSchema,
  GenerateCompletionOtpSchema
} from "../dtos/booking.dto";

const router = Router();
const bookingController = new BookingController(bookingService);

router.get(ROUTES.BOOKINGS.SLOTS, bookingController.getAvailableSlots);
router.use(authMiddleware);
router.get(ROUTES.BOOKINGS.DETAIL, bookingController.getBookingDetail);

router.post(ROUTES.BOOKINGS.CREATE, roleMiddleware("user"), validate(CreateBookingSchema), bookingController.createBooking);
router.get(ROUTES.BOOKINGS.MY_BOOKINGS, roleMiddleware("user"), bookingController.getUserBookings);
router.post(ROUTES.BOOKINGS.CANCEL, roleMiddleware("user"), validate(CancelBookingSchema), bookingController.cancelBooking);
router.post(ROUTES.BOOKINGS.RESCHEDULE, roleMiddleware("user"), validate(RescheduleBookingSchema), bookingController.rescheduleBooking);
router.post(ROUTES.BOOKINGS.ACCEPT_RESCHEDULE, roleMiddleware("user"), bookingController.customerAcceptReschedule);
router.post(ROUTES.BOOKINGS.REJECT_RESCHEDULE, roleMiddleware("user"), bookingController.customerRejectReschedule);

router.get(ROUTES.BOOKINGS.PROVIDER_JOBS, roleMiddleware("provider"), bookingController.getProviderBookings);
router.post(ROUTES.BOOKINGS.ACCEPT, roleMiddleware("provider"), bookingController.acceptBooking);
router.put(ROUTES.BOOKINGS.STATUS, roleMiddleware("provider"), validate(UpdateBookingStatusSchema), bookingController.updateBookingStatus);
router.post(ROUTES.BOOKINGS.PROVIDER_CANCEL, roleMiddleware("provider"), validate(CancelBookingSchema), bookingController.cancelBooking);
router.post(ROUTES.BOOKINGS.PROVIDER_RESCHEDULE, roleMiddleware("provider"), validate(RescheduleBookingSchema), bookingController.providerRescheduleBooking);
router.post(ROUTES.BOOKINGS.ARRIVAL_OTP_GENERATE, roleMiddleware("provider"), bookingController.generateArrivalOtp);
router.post(ROUTES.BOOKINGS.ARRIVAL_OTP_VERIFY, roleMiddleware("provider"), bookingController.verifyArrivalOtp);
router.post(ROUTES.BOOKINGS.COMPLETION_OTP_GENERATE, roleMiddleware("provider"), validate(GenerateCompletionOtpSchema), bookingController.generateCompletionOtp);
router.post(ROUTES.BOOKINGS.COMPLETION_OTP_VERIFY, roleMiddleware("provider"), bookingController.verifyCompletionOtp);

export default router;