import { z } from "zod";

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