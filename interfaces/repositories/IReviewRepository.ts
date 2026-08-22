import { IReview } from "../../types/review.types";

export interface IReviewRepository {
  findByBookingAndUser(bookingId: string, userId: string): Promise<IReview | null>;
  findByBookingId(bookingId: string): Promise<IReview | null>;
  findByProviderId(providerId: string, skip: number, limit: number): Promise<IReview[]>;
  countByProviderId(providerId: string): Promise<number>;
  findById(id: string): Promise<IReview | null>;
  create(data: {
    bookingId: string;
    providerId: string;
    userId: string;
    rating: number;
    reviewText: string;
  }): Promise<IReview>;
  toggleLikeByProvider(id: string, liked: boolean): Promise<IReview | null>;
  getProviderStats(providerId: string): Promise<{ averageRating: number; totalReviews: number }>;
}