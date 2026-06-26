import { IBooking } from "../../types/booking.types";

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

export interface VerifyPaymentResult {
  booking: IBooking;
  alreadyProcessed: boolean;
  message: string;
}

export interface IPaymentService {
  createCheckoutSession(userId: string, bookingId: string): Promise<CheckoutResult>;
  verifyAndFinalizePayment(sessionId: string, bookingId: string): Promise<VerifyPaymentResult>;
  handleWebhookEvent(event: { type: string; data: { object: Record<string, unknown> } }): Promise<void>;
}
