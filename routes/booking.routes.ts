import express from "express";
import { BookingController } from "../controllers/booking.controller";
import { BookingService } from "../services/booking.service";
import { BookingRepository } from "../repositories/booking.repository";
import { ProviderProfileRepository } from "../repositories/providerProfile.repository";
import { ProviderAvailabilityRepository } from "../repositories/providerAvailability.repository";
import { ConversationRepository } from "../repositories/conversation.repository";
import { MessageRepository } from "../repositories/message.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { NotificationService } from "../services/notification.service";
import { Mailer } from "../utils/mailer";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
    CreateBookingSchema,
    CancelBookingSchema,
    RescheduleBookingSchema,
    VerifyOtpSchema,
    CompletionInvoiceSchema,
    AvailableSlotsSchema,
} from "../dtos/booking.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const bookingRepository = new BookingRepository();
const providerProfileRepository = new ProviderProfileRepository();
const providerAvailabilityRepository = new ProviderAvailabilityRepository();
const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const notificationRepository = new NotificationRepository();

const notificationService = new NotificationService(notificationRepository);
const mailer = new Mailer();
const bookingService = new BookingService(
    bookingRepository,
    providerProfileRepository,
    providerAvailabilityRepository,
    conversationRepository,
    messageRepository,
    notificationService,
    mailer
);
const bookingController = new BookingController(bookingService);

router.use(authMiddleware);

router.get(
    ROUTES.BOOKINGS.SLOTS,
    validate(AvailableSlotsSchema),
    bookingController.getAvailableSlots
);

router.post(
    ROUTES.BOOKINGS.CREATE,
    roleMiddleware(["user"]),
    validate(CreateBookingSchema),
    bookingController.createBooking
);

router.get(ROUTES.BOOKINGS.LIST, roleMiddleware(["user"]), bookingController.getUserBookings);
router.get(ROUTES.BOOKINGS.PROVIDER_LIST, roleMiddleware(["provider"]), bookingController.getProviderBookings);

router.get(ROUTES.BOOKINGS.DETAIL, bookingController.getBookingDetail);
router.patch(ROUTES.BOOKINGS.CANCEL, validate(CancelBookingSchema), bookingController.cancelBooking);
router.patch(
    ROUTES.BOOKINGS.RESCHEDULE,
    roleMiddleware(["user"]),
    validate(RescheduleBookingSchema),
    bookingController.rescheduleBooking
);

router.patch(
    ROUTES.BOOKINGS.PROVIDER_RESCHEDULE,
    roleMiddleware(["provider"]),
    validate(RescheduleBookingSchema),
    bookingController.providerRescheduleBooking
);

router.patch(ROUTES.BOOKINGS.ACCEPT_RESCHEDULE, roleMiddleware(["user"]), bookingController.customerAcceptReschedule);
router.patch(ROUTES.BOOKINGS.REJECT_RESCHEDULE, roleMiddleware(["user"]), bookingController.customerRejectReschedule);

router.patch(ROUTES.BOOKINGS.ACCEPT, roleMiddleware(["provider"]), bookingController.acceptBooking);
router.patch(ROUTES.BOOKINGS.CONFIRM, roleMiddleware(["provider"]), bookingController.confirmBooking);
router.patch(ROUTES.BOOKINGS.COMPLETE, roleMiddleware(["provider"]), bookingController.completeBooking);

router.post(
    ROUTES.BOOKINGS.OTP_ARRIVAL_GENERATE,
    roleMiddleware(["provider"]),
    bookingController.generateArrivalOtp
);
router.post(
    ROUTES.BOOKINGS.OTP_ARRIVAL_VERIFY,
    roleMiddleware(["provider"]),
    validate(VerifyOtpSchema),
    bookingController.verifyArrivalOtp
);
router.post(
    ROUTES.BOOKINGS.OTP_COMPLETION_GENERATE,
    roleMiddleware(["provider"]),
    validate(CompletionInvoiceSchema),
    bookingController.generateCompletionOtp
);
router.post(
    ROUTES.BOOKINGS.OTP_COMPLETION_VERIFY,
    roleMiddleware(["provider"]),
    validate(VerifyOtpSchema),
    bookingController.verifyCompletionOtp
);

export default router;