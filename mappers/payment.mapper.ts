import { BookingMapper } from "./booking.mapper";
import { IBooking } from "../types/booking.types";

export class PaymentMapper {
  static toCheckoutResponse(result: { id: string; url: string | null; amount_total: number | null } | null) {
    if (!result) return null;
    return {
      sessionId: result.id,
      url: result.url,
      amount: result.amount_total
    };
  }

  static toWebhookResponse(result: { booking: IBooking | null; alreadyProcessed?: boolean } | null) {
    if (!result) return null;
    return {
      booking: result.booking ? BookingMapper.toResponse(result.booking) : null,
      alreadyProcessed: result.alreadyProcessed
    };
  }
}
