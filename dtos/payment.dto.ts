import { z } from "zod";
import { BookingResponseDTO } from "./booking.dto";

export const CreateCheckoutSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, "bookingId is required"),
  }),
});

export const VerifyPaymentSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "sessionId is required"),
    bookingId: z.string().min(1, "bookingId is required"),
  }),
});

export interface CheckoutResultDTO {
  sessionId: string;
  url: string | null;
  amount: number | null;
}

export interface VerifyPaymentResultDTO {
  booking: BookingResponseDTO | null;
  alreadyProcessed: boolean;
  message: string;
}

export interface WebhookResultDTO {
  booking: BookingResponseDTO | null;
  alreadyProcessed?: boolean;
}
