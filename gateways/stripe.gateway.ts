import Stripe from "stripe";
import { CheckoutSessionResult,CreateCheckoutParams,IPaymentGateway,} from "./payment.gateway";
import { InternalServerError } from "../utils/error";

export class StripePaymentGateway implements IPaymentGateway {
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new InternalServerError("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" });
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.productName,
              description: params.description,
            },
            unit_amount: params.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    if (!session.url) {
      throw new InternalServerError("Stripe did not return a checkout URL");
    }

    return { sessionId: session.id, url: session.url };
  }
}