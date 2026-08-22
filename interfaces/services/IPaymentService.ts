import { CheckoutResultDTO, VerifyPaymentResultDTO, WebhookResultDTO } from "../../dtos/payment.dto";

export interface IPaymentService {
  createCheckoutSession(userId: string, bookingId: string): Promise<CheckoutResultDTO | null>;
  verifyAndFinalizePayment(sessionId: string, bookingId: string): Promise<VerifyPaymentResultDTO | null>;
  handleWebhookEvent(event: { type: string; data: { object: Record<string, unknown> } }): Promise<WebhookResultDTO | null>;
  payWithWallet(userId: string, bookingId: string): Promise<void>;
}
