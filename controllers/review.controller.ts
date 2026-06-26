import { Request, Response, NextFunction } from "express";
import { IReviewService } from "../interfaces/services/IReviewService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { ReviewMapper } from "../mappers/review.mapper";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class ReviewController {
  private readonly _reviewService: IReviewService;
  constructor(reviewService: IReviewService) {
    this._reviewService = reviewService;
  }

  createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { bookingId, rating, reviewText } = req.body;
      const { review, isNew } = await this._reviewService.createReview(userId, {
        bookingId,
        rating,
        reviewText,
      });

      const status = isNew ? HttpStatusCode.CREATED : HttpStatusCode.OK;
      const message = isNew
        ? SUCCESS_MESSAGES.REVIEW_SUBMITTED
        : SUCCESS_MESSAGES.REVIEW_ALREADY_SUBMITTED;

      res.status(status).json(
        createSuccessResponse({ review: ReviewMapper.toResponse(review) }, message)
      );
    } catch (error) {
      next(error);
    }
  };

  getProviderReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { providerId } = req.params;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

      const result = await this._reviewService.getProviderReviews(providerId, page, limit);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          {
            reviews: result.reviews.map(ReviewMapper.toResponse),
            pagination: result.pagination,
          },
          SUCCESS_MESSAGES.REVIEWS_FETCHED
        )
      );
    } catch (error) {
      next(error);
    }
  };

  likeReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const review = await this._reviewService.likeReview(id, userId);

      const message = review.likedByProvider
        ? SUCCESS_MESSAGES.REVIEW_LIKED
        : SUCCESS_MESSAGES.REVIEW_UNLIKED;

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse({ review: ReviewMapper.toResponse(review) }, message)
      );
    } catch (error) {
      next(error);
    }
  };
}
