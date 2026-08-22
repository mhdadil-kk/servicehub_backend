import { IPaymentService } from "../interfaces/services/IPaymentService";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IPaymentGateway } from "../gateways/payment.gateway";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { IWalletService } from "../interfaces/services/IWalletService";
import { CheckoutResultDTO, VerifyPaymentResultDTO, WebhookResultDTO } from "../dtos/payment.dto";
import { PaymentMapper } from "../mappers/payment.mapper";
import mongoose from "mongoose";

export class PaymentService implements IPaymentService {
  constructor(
    private _bookingRepository: IBookingRepository,
    private _transactionRepository: ITransactionRepository,
    private _stripeGateway: IPaymentGateway,
    private _walletService: IWalletService,
    private _providerProfileRepository: IProviderProfileRepository
  ) {}

  async createCheckoutSession(userId: string, bookingId: string): Promise<CheckoutResultDTO | null> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const amount = booking.status === "awaiting_payment"
      ? 100
      : booking.status === "completed_pending_payment"
      ? booking.totalAmount - 100
      : 0;

    if (amount <= 0) throw new BadRequestError(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);

    const sessionData = await this._stripeGateway.createCheckoutSession({
      amount,
      currency: "inr",
      productName: "ServiceHub Booking Payment",
      description: `Payment for booking ${bookingId}`,
      successUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancelUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/booking/cancel?booking_id=${bookingId}`,
      metadata: { bookingId, userId, status: booking.status },
    });

    return PaymentMapper.toCheckoutResponse(sessionData);
  }

  async verifyAndFinalizePayment(sessionId: string, bookingId: string): Promise<VerifyPaymentResultDTO | null> {
    const session = await this._stripeGateway.retrieveSession(sessionId);
    if (!session || session.payment_status !== "paid") {
      throw new BadRequestError(ERROR_MESSAGES.PAYMENT_NOT_COMPLETED);
    }

    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    if (booking.paymentStatus === "paid" || booking.paymentStatus === "fully_paid") {
      return { 
        booking: PaymentMapper.toWebhookResponse({ booking })?.booking || null, 
        alreadyProcessed: true, 
        message: "Payment already processed." 
      };
    }

    const isFinalPayment = booking.status === "completed_pending_payment";
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : undefined;

    await this._transactionRepository.createTransaction({
      walletId: new mongoose.Types.ObjectId().toString(), 
      userId: booking.userId.toString(),
      type: "debit",
      amount: (session.amount_total || 0) / 100,
      description: `Stripe Payment for booking`,
      referenceId: bookingId,
      status: "success",
    });

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      paymentStatus: isFinalPayment ? "fully_paid" : "paid",
      status: isFinalPayment ? "completed" : "confirmed",
      paymentIntentId: paymentIntentId || booking.paymentIntentId,
    });
    
    if (updated) {
      await this._walletService.logExpense(
        updated.userId.toString(),
        (session.amount_total || 0) / 100,
        `Stripe Payment for booking`,
        bookingId
      );
    }

    return { 
      booking: PaymentMapper.toWebhookResponse({ booking: updated })?.booking || null, 
      alreadyProcessed: false, 
      message: "Payment verified successfully." 
    };
  }

  async handleWebhookEvent(event: { type: string; data: { object: Record<string, unknown> } }): Promise<WebhookResultDTO | null> {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata as Record<string, string> | undefined;
      const bookingId = metadata?.bookingId;

      if (bookingId) {
        const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
        if (booking) {
          if (booking.paymentStatus === "paid" || booking.paymentStatus === "fully_paid") {
            return PaymentMapper.toWebhookResponse({ booking, alreadyProcessed: true });
          }

          const isFinal = booking.status === "completed_pending_payment";
          const updated = await this._bookingRepository.updateStatus(bookingId, {
            paymentStatus: isFinal ? "fully_paid" : "paid",
            status: isFinal ? "completed" : "confirmed",
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          });
          
          if (updated) {
            await this._walletService.logExpense(
              updated.userId.toString(),
              (Number(session.amount_total) || 0) / 100,
              `Stripe Webhook Payment`,
              bookingId
            );
          }
          return PaymentMapper.toWebhookResponse({ booking: updated, alreadyProcessed: false });
        }
      }
    }
    return null;
  }

  async payWithWallet(userId: string, bookingId: string): Promise<void> {
    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);

    const amount = booking.status === "awaiting_payment"
      ? 100
      : booking.status === "completed_pending_payment"
      ? booking.totalAmount - 100
      : 0;

    if (amount <= 0) throw new BadRequestError(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);

    const wallet = await this._walletService.getWallet(userId);
    if (wallet.balance < amount) throw new BadRequestError(ERROR_MESSAGES.INSUFFICIENT_BALANCE);

    await this._walletService.debit(userId, amount, `Wallet Payment for booking`, bookingId);
    const isFinalPayment = booking.status === "completed_pending_payment";

    await this._bookingRepository.updateStatus(bookingId, {
      paymentStatus: isFinalPayment ? "fully_paid" : "paid",
      status: isFinalPayment ? "completed" : "confirmed",
    });

    if (isFinalPayment && booking.providerId) {
      const providerProfile = await this._providerProfileRepository.findById(booking.providerId.toString());
      if (providerProfile) {
        await this._walletService.credit(
          providerProfile.userId.toString(),
          booking.totalAmount - 100, 
          `Payment received for booking`,
          bookingId
        );
      }
    }
  }
}