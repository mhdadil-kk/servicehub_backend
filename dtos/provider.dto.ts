import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  body: z.object({
    bio: z.string().min(20, "Bio should be at least 20 characters long").optional(),
    serviceRadius: z.string().transform(val => Number(val)).optional(), // Multer sends everything as string
  })
});

export const ServiceDetailsSchema = z.object({
  body: z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Service ID"),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
  })
});

export const DocumentUploadSchema = z.object({
  body: z.object({
  }).optional()
});
