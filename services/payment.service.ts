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
      successUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancelUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment-cancel?booking_id=${bookingId}`,
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

    const isFinalPayment = 
      booking.status === "completed_pending_payment" || 
      session.metadata?.status === "completed_pending_payment";

    if (isFinalPayment) {
      if (booking.paymentStatus === "fully_paid" || booking.status === "completed") {
        return { 
          booking: PaymentMapper.toWebhookResponse({ booking })?.booking || null, 
          alreadyProcessed: true, 
          message: "Payment already processed." 
        };
      }
    } else {
      if (booking.paymentStatus === "paid" || booking.paymentStatus === "fully_paid") {
        return { 
          booking: PaymentMapper.toWebhookResponse({ booking })?.booking || null, 
          alreadyProcessed: true, 
          message: "Payment already processed." 
        };
      }
    }

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : undefined;

    const customerId = (typeof booking.userId === "object" && booking.userId !== null && "_id" in booking.userId)
      ? String((booking.userId as { _id: unknown })._id)
      : String(booking.userId);

    const updated = await this._bookingRepository.updateStatus(bookingId, {
      paymentStatus: isFinalPayment ? "fully_paid" : "paid",
      status: isFinalPayment ? "completed" : "confirmed",
      paymentIntentId: paymentIntentId || booking.paymentIntentId,
    });
    
    if (updated) {
      await this._walletService.logExpense(
        customerId,
        (session.amount_total || 0) / 100,
        `Stripe Payment for booking`,
        bookingId
      );

      if (isFinalPayment && booking.providerId) {
        const providerProfileId = (typeof booking.providerId === "object" && booking.providerId !== null && "_id" in booking.providerId)
          ? String((booking.providerId as { _id: unknown })._id)
          : String(booking.providerId);

        const providerProfile = await this._providerProfileRepository.findById(providerProfileId);
        if (providerProfile) {
          const providerUserId = (typeof providerProfile.userId === "object" && providerProfile.userId !== null && "_id" in providerProfile.userId)
            ? String((providerProfile.userId as { _id: unknown })._id)
            : String(providerProfile.userId);

          await this._walletService.credit(
            providerUserId,
            booking.totalAmount - 100,
            `Payment received for booking`,
            bookingId
          );
        }
      }
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
          const isFinal = 
            booking.status === "completed_pending_payment" || 
            metadata?.status === "completed_pending_payment";

          if (isFinal) {
            if (booking.paymentStatus === "fully_paid" || booking.status === "completed") {
              return PaymentMapper.toWebhookResponse({ booking, alreadyProcessed: true });
            }
          } else {
            if (booking.paymentStatus === "paid" || booking.paymentStatus === "fully_paid") {
              return PaymentMapper.toWebhookResponse({ booking, alreadyProcessed: true });
            }
          }

          const customerId = (typeof booking.userId === "object" && booking.userId !== null && "_id" in booking.userId)
            ? String((booking.userId as { _id: unknown })._id)
            : String(booking.userId);

          const updated = await this._bookingRepository.updateStatus(bookingId, {
            paymentStatus: isFinal ? "fully_paid" : "paid",
            status: isFinal ? "completed" : "confirmed",
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          });
          
          if (updated) {
            await this._walletService.logExpense(
              customerId,
              (Number(session.amount_total) || 0) / 100,
              `Stripe Webhook Payment`,
              bookingId
            );

            if (isFinal && booking.providerId) {
              const providerProfileId = (typeof booking.providerId === "object" && booking.providerId !== null && "_id" in booking.providerId)
                ? String((booking.providerId as { _id: unknown })._id)
                : String(booking.providerId);

              const providerProfile = await this._providerProfileRepository.findById(providerProfileId);
              if (providerProfile) {
                const providerUserId = (typeof providerProfile.userId === "object" && providerProfile.userId !== null && "_id" in providerProfile.userId)
                  ? String((providerProfile.userId as { _id: unknown })._id)
                  : String(providerProfile.userId);

                await this._walletService.credit(
                  providerUserId,
                  booking.totalAmount - 100,
                  `Payment received for booking`,
                  bookingId
                );
              }
            }
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

    const isFinalPayment = booking.status === "completed_pending_payment";

    if (isFinalPayment) {
      if (booking.paymentStatus === "fully_paid" || booking.status === "completed") {
        throw new BadRequestError("Booking payment has already been completed.");
      }
    } else {
      if (booking.paymentStatus === "paid" || booking.paymentStatus === "fully_paid") {
        throw new BadRequestError("Booking payment has already been completed.");
      }
    }

    const amount = booking.status === "awaiting_payment"
      ? 100
      : isFinalPayment
      ? booking.totalAmount - 100
      : 0;

    if (amount <= 0) throw new BadRequestError(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);

    const wallet = await this._walletService.getWallet(userId);
    if (wallet.balance < amount) throw new BadRequestError(ERROR_MESSAGES.INSUFFICIENT_BALANCE);

    await this._walletService.debit(userId, amount, `Wallet Payment for booking`, bookingId);

    await this._bookingRepository.updateStatus(bookingId, {
      paymentStatus: isFinalPayment ? "fully_paid" : "paid",
      status: isFinalPayment ? "completed" : "confirmed",
    });

    if (isFinalPayment && booking.providerId) {
      const providerProfileId = (typeof booking.providerId === "object" && booking.providerId !== null && "_id" in booking.providerId)
        ? String((booking.providerId as { _id: unknown })._id)
        : String(booking.providerId);

      const providerProfile = await this._providerProfileRepository.findById(providerProfileId);
      if (providerProfile) {
        const providerUserId = (typeof providerProfile.userId === "object" && providerProfile.userId !== null && "_id" in providerProfile.userId)
          ? String((providerProfile.userId as { _id: unknown })._id)
          : String(providerProfile.userId);

        await this._walletService.credit(
          providerUserId,
          booking.totalAmount - 100, 
          `Payment received for booking`,
          bookingId
        );
      }
    }
  }
}