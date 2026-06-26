import mongoose from "mongoose";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { IWalletService } from "../interfaces/services/IWalletService";
import { INotificationService } from "../interfaces/services/INotificationService";
import { IPaymentGateway } from "../gateways/payment.gateway";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/error";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages";
import { PLATFORM_BOOKING_FEE, PAYMENT_STAGES } from "../constants/payment.constants";
import { logger } from "../utils/logger";
import { IBooking } from "../types/booking.types";
import { IPaymentService, CheckoutResult, VerifyPaymentResult } from "../interfaces/services/IPaymentService";

export class PaymentService implements IPaymentService {
    private _bookingRepository: IBookingRepository;
  private _walletService: IWalletService;
  private _notificationService: INotificationService;
  private _paymentGateway: IPaymentGateway;
  constructor(
    bookingRepository: IBookingRepository,
    walletService: IWalletService,
    notificationService: INotificationService,
    paymentGateway: IPaymentGateway
  ) {
    this._bookingRepository = bookingRepository;
    this._walletService = walletService;
    this._notificationService = notificationService;
    this._paymentGateway = paymentGateway;
}

  async createCheckoutSession(userId: string, bookingId: string): Promise<CheckoutResult> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_BOOKING_ID);
    }

    const booking = await this._bookingRepository.findByIdWithService(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (booking.userId.toString() !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED_BOOKING_ACCESS);
    }

    if (booking.status === "completed") {
      throw new BadRequestError(ERROR_MESSAGES.BOOKING_ALREADY_COMPLETED);
    }

    let amount = 0;
    let description = "";
    let paymentStage = "";

    if (booking.status === "completed_pending_payment") {
      amount = booking.totalAmount || 1000;
      description = `Final Payment for service on ${booking.date}`;
      paymentStage = PAYMENT_STAGES.FINAL;
    } else if (booking.status === "awaiting_payment") {
      amount = PLATFORM_BOOKING_FEE;
      description = `Platform Booking Fee for ${booking.date}`;
      paymentStage = PAYMENT_STAGES.BOOKING_FEE;
    } else {
      throw new BadRequestError(ERROR_MESSAGES.PAYMENT_NOT_REQUIRED);
    }

    const service = booking.serviceId as mongoose.Types.ObjectId & { name?: string };
    const serviceName = service?.name ?? "Service Booking";

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

    const session = await this._paymentGateway.createCheckoutSession({
      amount,
      currency: "inr",
      productName: serviceName,
      description,
      successUrl: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
      cancelUrl: `${frontendUrl}/payment-cancel?booking_id=${booking._id}`,
      metadata: {
        bookingId: booking._id.toString(),
        userId,
        paymentStage,
      },
    });

    await this._bookingRepository.updateStripeSession(booking._id.toString(), session.sessionId);

    return session;
  }

  async verifyAndFinalizePayment(sessionId: string, bookingId: string): Promise<VerifyPaymentResult> {
    const booking = await this._bookingRepository.findByIdWithProviderUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (booking.stripeSessionId !== sessionId) {
      throw new BadRequestError(ERROR_MESSAGES.SESSION_ID_MISMATCH);
    }

    const alreadyProcessed =
      (booking.status === "confirmed" && booking.paymentStatus === "paid") ||
      (booking.status === "completed" && booking.paymentStatus === "fully_paid");

    if (alreadyProcessed) {
      return {
        booking,
        alreadyProcessed: true,
        message: SUCCESS_MESSAGES.PAYMENT_ALREADY_PROCESSED,
      };
    }

    if (booking.status === "awaiting_payment") {
      await this.processBookingFeePayment(booking);
    } else if (booking.status === "completed_pending_payment") {
      await this.processFinalPayment(booking);
    } else {
      logger.warn(`[verify] Booking ${booking._id} in unexpected state: ${booking.status}`);
    }

    const updated = (await this._bookingRepository.findById(bookingId)) ?? booking;

    return {
      booking: updated,
      alreadyProcessed: false,
      message: SUCCESS_MESSAGES.PAYMENT_VERIFIED,
    };
  }

  private async processBookingFeePayment(booking: IBooking): Promise<void> {
    const updated = await this._bookingRepository.confirmBookingFeePaid(booking._id.toString());
    if (!updated) {
      logger.info(`[verify] Booking fee paid already processed for ${booking._id}`);
      return;
    }

    await this._walletService.logExpense(
      booking.userId.toString(),
      PLATFORM_BOOKING_FEE,
      "Platform Booking Fee",
      booking._id.toString()
    );

    await this._notificationService.create({
      userId: booking.userId.toString(),
      title: "Booking Confirmed!",
      message: `Your ₹${PLATFORM_BOOKING_FEE} platform fee was received. Booking for ${booking.date} is now confirmed.`,
      type: "success",
      relatedId: booking._id.toString(),
    });

    logger.info(`[verify] Booking fee paid. Booking ${booking._id} → confirmed.`);
  }

  private async processFinalPayment(booking: IBooking): Promise<void> {
    const updated = await this._bookingRepository.confirmFinalPaymentPaid(booking._id.toString());
    if (!updated) {
      logger.info(`[verify] Final payment already processed for ${booking._id}`);
      return;
    }

    const totalAmt = booking.totalAmount || 0;
    const provider = booking.providerId as mongoose.Types.ObjectId & {
      userId?: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId };
    };
    const rawUserId = provider?.userId as unknown;
    const providerUserId =
      rawUserId && typeof rawUserId === "object" && "_id" in rawUserId
        ? (rawUserId as { _id: mongoose.Types.ObjectId })._id.toString()
        : rawUserId?.toString();

    if (!providerUserId) {
      logger.warn(`[verify] Could not resolve providerUserId for booking ${booking._id}. Skipping provider credit.`);
    }

    await this._walletService.logExpense(
      booking.userId.toString(),
      totalAmt,
      "Payment for Service Completion",
      booking._id.toString()
    );

    if (providerUserId) {
      await this._walletService.credit(
        providerUserId,
        totalAmt,
        "Earnings from Completed Service",
        booking._id.toString()
      );

      await this._notificationService.create({
        userId: providerUserId,
        title: "Payment Received!",
        message: `Customer paid ₹${totalAmt} for the completed service. Funds added to your wallet.`,
        type: "success",
        relatedId: booking._id.toString(),
      });
    }

    await this._notificationService.create({
      userId: booking.userId.toString(),
      title: "Payment Complete - Thank You!",
      message: `Your final payment of ₹${totalAmt} was received. Booking fully completed!`,
      type: "success",
      relatedId: booking._id.toString(),
    });

    logger.info(`[verify] Final invoice paid. Booking ${booking._id} → completed.`);
  }

  async handleWebhookEvent(event: { type: string; data: { object: Record<string, unknown> } }): Promise<void> {
    if (event.type !== "checkout.session.completed") return;

    const session = event.data.object as {
      metadata?: { bookingId?: string; paymentStage?: string };
    };

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;

    const booking = await this._bookingRepository.findByIdWithProviderUser(bookingId);
    if (!booking) return;

    if (
      session.metadata?.paymentStage === PAYMENT_STAGES.BOOKING_FEE &&
      booking.status === "awaiting_payment"
    ) {
      await this.processBookingFeePayment(booking);
    } else if (
      session.metadata?.paymentStage === PAYMENT_STAGES.FINAL &&
      booking.status === "completed_pending_payment"
    ) {
      await this.processFinalPayment(booking);
    }
  }
}