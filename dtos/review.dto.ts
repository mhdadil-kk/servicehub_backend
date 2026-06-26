import { z } from "zod";

export const CreateReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, "bookingId is required"),
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().min(1, "reviewText is required").max(1000),
  }),
});

export const GetProviderReviewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});
