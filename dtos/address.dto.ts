import { z } from "zod";

export const CreateAddressSchema = z.object({
  body: z.object({
    label: z.string().min(1),
    fullAddress: z.string().min(5),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const UpdateAddressSchema = z.object({
  body: z.object({
    label: z.string().min(1).optional(),
    fullAddress: z.string().min(5).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
});