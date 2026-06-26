import { IReview } from "../../models/review.model";
import { ReviewPagination } from "../../types/review.types";

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  reviewText: string;
}

export interface CreateReviewResult {
  review: IReview;
  isNew: boolean;
}

export interface ProviderReviewsResult {
  reviews: IReview[];
  pagination: ReviewPagination;
}

export interface IReviewService {
  createReview(userId: string, input: CreateReviewInput): Promise<CreateReviewResult>;
  getProviderReviews(
    providerId: string,
    page: number,
    limit: number
  ): Promise<ProviderReviewsResult>;
  likeReview(reviewId: string, providerUserId: string): Promise<IReview>;
}
