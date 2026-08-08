import { z } from "zod";

export const CreateBookingSchema = z.object({
  body: z.object({
    providerId: z.string().min(1),
    serviceId: z.string().min(1),
    addressId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slot: z.object({
      start: z.string().min(1),
      end: z.string().min(1),
    }),
    notes: z.string().optional(),
    rescheduledFrom: z.string().optional(),
  }),
});

export const CancelBookingSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const RescheduleBookingSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slot: z.object({
      start: z.string().min(1),
      end: z.string().min(1),
    }),
    addressId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const VerifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().min(4).max(6),
  }),
});

export const CompletionInvoiceSchema = z.object({
  body: z.object({
    invoiceData: z.object({
      baseCharge: z.number().positive(),
      extraCharges: z
        .array(
          z.object({
            description: z.string(),
            amount: z.number(),
          })
        )
        .optional(),
    }),
  }),
});

export const AvailableSlotsSchema = z.object({
  query: z.object({
    providerId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export const UpdateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(["accepted", "rejected", "completed", "cancelled", "started", "arrived"]),
  }),
});

export const GenerateCompletionOtpSchema = z.object({
  body: z.object({
    invoiceData: z.object({
      baseCharge: z.number().positive(),
      extraCharges: z.array(
        z.object({
          description: z.string(),
          amount: z.number(),
        })
      ).optional(),
    }).optional(),
  }).optional(),
});