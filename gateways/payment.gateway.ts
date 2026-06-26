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
  url: string;
}

export interface IPaymentGateway {
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;
}