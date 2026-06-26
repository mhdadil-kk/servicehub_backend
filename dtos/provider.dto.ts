import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long").optional(),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
    bio: z.string().min(20, "Bio should be at least 20 characters long").optional(),
    serviceRadius: z.string().transform(val => Number(val)).optional(), 
    address: z.string().min(5, "Address must be at least 5 characters long").optional(),
    latitude: z.string().transform(val => Number(val)).optional(),
    longitude: z.string().transform(val => Number(val)).optional(),
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

export const LocationUpdateSchema = z.object({
  body: z.object({
    address: z.string().min(5).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    serviceRadius: z.coerce.number().min(1).optional(),
  }),
});

export const BankDetailsSchema = z.object({
  body: z.object({
    accountHolderName: z.string().min(1),
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    routingNumber: z.string().min(1),
  }),
});