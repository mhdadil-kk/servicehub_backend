export interface CreateCheckoutParams {
  amount: number;
  currency: string;
  productName: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  id: string;
  url: string;
  amount_total?: number | null;
}

export interface StripeSessionResult {
  id: string;
  payment_status: string;
  payment_intent?: string | null;
  amount_total?: number | null;
  metadata?: Record<string, string> | null;
}

export interface IPaymentGateway {
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;
  retrieveSession(sessionId: string): Promise<StripeSessionResult | null>;
}