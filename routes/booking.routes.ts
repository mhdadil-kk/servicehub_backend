import express from "express";
import { BookingController } from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = express.Router();
const bookingController = new BookingController();

router.use(authMiddleware);

// Get available slots for a provider (user/provider can view)
router.get("/slots", bookingController.getAvailableSlots);

// Customer bookings
router.post("/", roleMiddleware(["user"]), bookingController.createBooking);
router.get("/", roleMiddleware(["user"]), bookingController.getUserBookings);

// Provider bookings
router.get("/provider", roleMiddleware(["provider"]), bookingController.getProviderBookings);

// Lifecycle actions
router.get("/:id", bookingController.getBookingDetail);
router.patch("/:id/cancel", bookingController.cancelBooking);
router.patch("/:id/reschedule", roleMiddleware(["user"]), bookingController.rescheduleBooking);

// Provider only confirmations
router.patch("/:id/accept", roleMiddleware(["provider"]), bookingController.acceptBooking);
router.patch("/:id/confirm", roleMiddleware(["provider"]), bookingController.confirmBooking);
router.patch("/:id/complete", roleMiddleware(["provider"]), bookingController.completeBooking);

// OTP Verification (Provider Only)
router.post("/:id/otp/arrival/generate", roleMiddleware(["provider"]), bookingController.generateArrivalOtp);
router.post("/:id/otp/arrival/verify", roleMiddleware(["provider"]), bookingController.verifyArrivalOtp);
router.post("/:id/otp/completion/generate", roleMiddleware(["provider"]), bookingController.generateCompletionOtp);
router.post("/:id/otp/completion/verify", roleMiddleware(["provider"]), bookingController.verifyCompletionOtp);

export default router;
