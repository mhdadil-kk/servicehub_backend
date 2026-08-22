import { ReviewModel, IReviewDocument } from "../models/review.model";
import { IReview } from "../types/review.types";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose";

import { IReviewRepository } from "../interfaces/repositories/IReviewRepository";

export class ReviewRepository
  extends BaseRepository<IReviewDocument>
  implements IReviewRepository
{
  constructor() {
    super(ReviewModel);
  }

  async findByBookingAndUser(
    bookingId: string,
    userId: string
  ): Promise<IReview | null> {
    return this.model
      .findOne({ bookingId, userId } as FilterQuery<IReviewDocument>)
      .populate("userId", "name profilePhoto")
      .exec() as unknown as IReview | null;
  }

  async findByBookingId(bookingId: string): Promise<IReview | null> {
    return this.model
      .findOne({ bookingId } as FilterQuery<IReviewDocument>)
      .populate("userId", "name profilePhoto")
      .exec() as unknown as IReview | null;
  }

  async findByProviderId(
    providerId: string,
    skip: number,
    limit: number
  ): Promise<IReview[]> {
    return this.model
      .find({ providerId } as FilterQuery<IReviewDocument>)
      .populate("userId", "name profilePhoto")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec() as unknown as IReview[];
  }

  async countByProviderId(providerId: string): Promise<number> {
    return this.model
      .countDocuments({ providerId } as FilterQuery<IReviewDocument>)
      .exec();
  }

  async create(data: {
    bookingId: string;
    providerId: string;
    userId: string;
    rating: number;
    reviewText: string;
  }): Promise<IReview> {
    return super.create(data as unknown as Partial<IReviewDocument>) as unknown as IReview;
  }

  async toggleLikeByProvider(id: string, liked: boolean): Promise<IReview | null> {
    return this.update(id, { likedByProvider: liked } as unknown as Partial<IReviewDocument>) as unknown as IReview | null;
  }

  async getProviderStats(providerId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await this.model.aggregate([
      { $match: { providerId } },
      {
        $group: {
          _id: "$providerId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    if (!result.length) return { averageRating: 0, totalReviews: 0 };
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    };
  }
}