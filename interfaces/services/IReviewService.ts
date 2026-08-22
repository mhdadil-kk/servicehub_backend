import { CreateReviewInputDTO, CreateReviewResultDTO, ProviderReviewsResultDTO, ReviewResponseDTO } from "../../dtos/review.dto";

export interface IReviewService {
  createReview(userId: string, input: CreateReviewInputDTO): Promise<CreateReviewResultDTO>;
  getProviderReviews(
    providerId: string,
    page: number,
    limit: number
  ): Promise<ProviderReviewsResultDTO>;
  likeReview(reviewId: string, providerUserId: string): Promise<ReviewResponseDTO>;
}
