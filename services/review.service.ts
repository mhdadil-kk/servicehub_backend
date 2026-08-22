import { IReviewRepository } from "../interfaces/repositories/IReviewRepository";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IReviewService } from "../interfaces/services/IReviewService";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { CreateReviewInputDTO, CreateReviewResultDTO, ProviderReviewsResultDTO, ReviewResponseDTO } from "../dtos/review.dto";
import { ReviewMapper } from "../mappers/review.mapper";
import mongoose from "mongoose";

export class ReviewService implements IReviewService {
  constructor(
    private _reviewRepository: IReviewRepository,
    private _bookingRepository: IBookingRepository,
    private _providerProfileRepository: IProviderProfileRepository
  ) {}

  async createReview(userId: string, input: CreateReviewInputDTO): Promise<CreateReviewResultDTO> {
    const { bookingId, rating, reviewText } = input;

    const booking = await this._bookingRepository.findByIdWithProviderAndUser(bookingId);
    if (!booking) {
      throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
    }

    if (booking.userId.toString() !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_AUTHORIZED_REVIEW);
    }

    if (booking.status !== "completed" && booking.status !== "completed_pending_payment") {
      throw new BadRequestError(ERROR_MESSAGES.ONLY_COMPLETED_CAN_BE_REVIEWED);
    }

    const providerId = booking.providerId.toString();
    const existingReview = await this._reviewRepository.findByBookingId(bookingId);
    
    if (existingReview) {
      return { review: ReviewMapper.toResponse(existingReview)!, isNew: false };
    }

    const newReview = await this._reviewRepository.create({
      bookingId,
      providerId,
      userId,
      rating,
      reviewText,
    });

    const stats = await this._reviewRepository.getProviderStats(providerId);
    await this._providerProfileRepository.updateRatingAndReviews(
      providerId,
      stats.averageRating,
      stats.totalReviews
    );

    const populatedReview = await this._reviewRepository.findById(newReview._id ? newReview._id.toString() : newReview.id);
    return { review: ReviewMapper.toResponse(populatedReview)!, isNew: true };
  }

  async getProviderReviews(providerId: string, page: number = 1, limit: number = 10): Promise<ProviderReviewsResultDTO> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_PROVIDER_ID);
    }

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this._reviewRepository.findByProviderId(providerId, skip, limit),
      this._reviewRepository.countByProviderId(providerId),
    ]);

    return {
      reviews: reviews.map((r) => ReviewMapper.toResponse(r)!),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async likeReview(reviewId: string, providerUserId: string): Promise<ReviewResponseDTO> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_REVIEW_ID);
    }

    const review = await this._reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError(ERROR_MESSAGES.REVIEW_NOT_FOUND);
    }

    const provider = await this._providerProfileRepository.findByUserId(providerUserId);
    if (!provider || provider._id.toString() !== review.providerId.toString()) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_AUTHORIZED_LIKE);
    }

    const updated = await this._reviewRepository.toggleLikeByProvider(
      reviewId,
      !review.likedByProvider
    );

    if (!updated) {
      throw new NotFoundError(ERROR_MESSAGES.REVIEW_NOT_FOUND);
    }

    return ReviewMapper.toResponse(updated)!;
  }
}