import mongoose, { FilterQuery } from "mongoose";
import { ReviewModel, IReviewDocument } from "../models/review.model";
import { IReview } from "../types/review.types";
import { IReviewRepository } from "../interfaces/repositories/IReviewRepository";

export class ReviewRepository implements IReviewRepository {
  async findByBookingAndUser(
    bookingId: string,
    userId: string
  ): Promise<IReview | null> {
    return ReviewModel
      .findOne({
        bookingId,
        userId,
      } as FilterQuery<IReviewDocument>)
      .populate("userId", "name profilePhoto")
      .exec() as unknown as IReview | null;
  }

  async findByBookingId(bookingId: string): Promise<IReview | null> {
    return ReviewModel
      .findOne({
        bookingId,
      } as FilterQuery<IReviewDocument>)
      .populate("userId", "name profilePhoto")
      .exec() as unknown as IReview | null;
  }

  async findByProviderId(
    providerId: string,
    skip: number,
    limit: number
  ): Promise<IReview[]> {
    return ReviewModel
      .find({
        providerId,
      } as FilterQuery<IReviewDocument>)
      .populate("userId", "name profilePhoto")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec() as unknown as IReview[];
  }

  async countByProviderId(providerId: string): Promise<number> {
    return ReviewModel
      .countDocuments({
        providerId,
      } as FilterQuery<IReviewDocument>)
      .exec();
  }

  async findById(id: string): Promise<IReview | null> {
    return ReviewModel
      .findById(id)
      .populate("userId", "name profilePhoto")
      .exec() as unknown as IReview | null;
  }

  async create(data: {
    bookingId: string;
    providerId: string;
    userId: string;
    rating: number;
    reviewText: string;
  }): Promise<IReview> {
    const review = await ReviewModel.create({
      bookingId: new mongoose.Types.ObjectId(data.bookingId),
      providerId: new mongoose.Types.ObjectId(data.providerId),
      userId: new mongoose.Types.ObjectId(data.userId),
      rating: data.rating,
      reviewText: data.reviewText,
    });

    return {
      ...review.toObject(),
      id: review._id.toString(),
    } as unknown as IReview;
  }

  async toggleLikeByProvider(
    id: string,
    liked: boolean
  ): Promise<IReview | null> {
    return ReviewModel
      .findByIdAndUpdate(
        id,
        { likedByProvider: liked },
        { returnDocument: "after" }
      )
      .populate("userId", "name profilePhoto")
      .exec() as unknown as IReview | null;
  }

  async getProviderStats(
    providerId: string
  ): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await ReviewModel.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
        },
      },
      {
        $group: {
          _id: "$providerId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (!result.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
      };
    }

    return {
      averageRating:
        Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    };
  }
}