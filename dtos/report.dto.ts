import { z } from "zod";

export const CreateReportSchema = z.object({
  body: z.object({
    reportedId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reported account ID"),
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID").optional(),
    category: z.enum(["Fraud", "Fake Profile", "Harassment", "Spam", "Payment Issue", "Inappropriate Behaviour", "Service Quality", "Other"]),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    screenshot: z.string().optional(),
  }),
});

export const ReportActionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid report ID"),
  }),
  body: z.object({
    action: z.enum(["warn", "block", "reject", "resolve"]),
    adminNotes: z.string().max(2000).optional(),
  }),
});

export const ReportIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid report ID"),
  }),
});

export const ReportQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
