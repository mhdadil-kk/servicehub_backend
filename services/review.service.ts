import mongoose from "mongoose";
import { IReviewRepository } from "../interfaces/repositories/IReviewRepository";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IReview } from "../types/review.types";
import { BadRequestError, NotFoundError, ForbiddenError } from "../utils/error";
import { REVIEWABLE_BOOKING_STATUSES } from "../constants/statuses";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../constants/messages";
import { IReviewService, CreateReviewInput, CreateReviewResult, ProviderReviewsResult } from "../interfaces/services/IReviewService";

export class ReviewService implements IReviewService {
    private _reviewRepository: IReviewRepository;
  private _bookingRepository: IBookingRepository;
  private _providerProfileRepository: IProviderProfileRepository;
  constructor(
    reviewRepository: IReviewRepository,
    bookingRepository: IBookingRepository,
    providerProfileRepository: IProviderProfileRepository
  ) {
    this._reviewRepository = reviewRepository;
    this._bookingRepository = bookingRepository;
    this._providerProfileRepository = providerProfileRepository;
}

  async createReview(userId: string, input: CreateReviewInput): Promise<CreateReviewResult> {
    const { bookingId, rating, reviewText } = input;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_BOOKING_ID);
    }

    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
    }

    if (booking.userId.toString() !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_AUTHORIZED_REVIEW);
    }

    if (
      !REVIEWABLE_BOOKING_STATUSES.includes(
        booking.status as (typeof REVIEWABLE_BOOKING_STATUSES)[number]
      )
    ) {
      throw new BadRequestError(
        `${ERROR_MESSAGES.BOOKING_NOT_REVIEWABLE} Current status: ${booking.status}`
      );
    }

    const existing = await this._reviewRepository.findByBookingAndUser(bookingId, userId);
    if (existing) {
      return { review: existing, isNew: false };
    }

    try {
      const review = await this._reviewRepository.create({
        bookingId,
        providerId: booking.providerId.toString(),
        userId,
        rating,
        reviewText,
      });

      await this.updateProviderRating(booking.providerId.toString(), rating);

      return { review, isNew: true };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: number }).code === 11000
      ) {
        const duplicate = await this._reviewRepository.findByBookingAndUser(bookingId, userId);
        if (duplicate) {
          return { review: duplicate, isNew: false };
        }
      }
      throw error;
    }
  }

  private async updateProviderRating(providerProfileId: string, newRating: number): Promise<void> {
    try {
      await this._providerProfileRepository.incrementRating(providerProfileId, newRating);
    } catch (err) {
      logger.warn(`Could not update provider rating: ${err}`);
    }
  }

  async getProviderReviews(
    providerId: string,
    page: number,
    limit: number
  ): Promise<ProviderReviewsResult> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_PROVIDER_ID);
    }

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this._reviewRepository.findByProviderId(providerId, skip, limit),
      this._reviewRepository.countByProviderId(providerId),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async likeReview(reviewId: string, providerUserId: string): Promise<IReview> {
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

    return updated;
  }
}
