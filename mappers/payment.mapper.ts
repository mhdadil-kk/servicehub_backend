import { IBooking } from "../types/booking.types";
import { BookingMapper } from "./booking.mapper";
import { CheckoutResultDTO, WebhookResultDTO } from "../dtos/payment.dto";

export class PaymentMapper {
  static toCheckoutResponse(result: { id: string; url: string | null; amount_total?: number | null } | null): CheckoutResultDTO | null {
    if (!result) return null;
    return {
      sessionId: result.id,
      url: result.url,
      amount: result.amount_total ?? null
    };
  }

  static toWebhookResponse(result: { booking: IBooking | null; alreadyProcessed?: boolean } | null): WebhookResultDTO | null {
    if (!result) return null;
    return {
      booking: result.booking ? BookingMapper.toResponse(result.booking) : null,
      alreadyProcessed: result.alreadyProcessed
    };
  }
}
