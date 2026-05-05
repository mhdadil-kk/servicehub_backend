import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const IdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid ID format")
  })
});

export const UpdateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid ID format")
  }),
  body: z.object({
    status: z.enum(["approved", "rejected", "pending"], {
      errorMap: () => ({ message: "Status must be approved, rejected, or pending" })
    })
  })
});

export const UserQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    sort: z.string().optional()
  })
});
