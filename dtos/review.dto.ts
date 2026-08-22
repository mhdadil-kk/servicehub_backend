import { z } from "zod";
import { ReviewPagination } from "../types/review.types";

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

export interface CreateReviewInputDTO {
  bookingId: string;
  rating: number;
  reviewText: string;
}

export interface ReviewUserSnippetDTO {
  _id: string;
  name: string;
  profilePhoto?: string;
}

export interface ReviewResponseDTO {
  _id: string;
  bookingId: string;
  providerId: string;
  userId: ReviewUserSnippetDTO | string;
  rating: number;
  reviewText: string;
  likedByProvider: boolean;
  created_at: string;
}

export interface CreateReviewResultDTO {
  review: ReviewResponseDTO;
  isNew: boolean;
}

export interface ProviderReviewsResultDTO {
  reviews: ReviewResponseDTO[];
  pagination: ReviewPagination;
}
