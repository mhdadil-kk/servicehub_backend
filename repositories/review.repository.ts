import { ReviewModel, IReview } from "../models/review.model";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose";
import { IReviewRepository } from "../interfaces/repositories/IReviewRepository";

export class ReviewRepository
  extends BaseRepository<IReview>
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
      .findOne({ bookingId, userId } as FilterQuery<IReview>)
      .populate("userId", "name profilePhoto")
      .exec();
  }

  async findByProviderId(
    providerId: string,
    skip: number,
    limit: number
  ): Promise<IReview[]> {
    return this.model
      .find({ providerId } as FilterQuery<IReview>)
      .populate("userId", "name profilePhoto")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByProviderId(providerId: string): Promise<number> {
    return this.model
      .countDocuments({ providerId } as FilterQuery<IReview>)
      .exec();
  }

  async create(data: {
    bookingId: string;
    providerId: string;
    userId: string;
    rating: number;
    reviewText: string;
  }): Promise<IReview> {
    return super.create(data as Partial<IReview>);
  }

  async toggleLikeByProvider(id: string, liked: boolean): Promise<IReview | null> {
    return this.update(id, { likedByProvider: liked });
  }
}
