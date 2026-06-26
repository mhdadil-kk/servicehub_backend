import { IReview } from "../models/review.model";
import { ReviewResponse, ReviewUserSnippet } from "../types/review.types";
import mongoose from "mongoose";

export class ReviewMapper {
  static toResponse(review: IReview): ReviewResponse {
    return {
      _id: review._id.toString(),
      bookingId: review.bookingId.toString(),
      providerId: review.providerId.toString(),
      userId: ReviewMapper.mapUserId(review.userId),
      rating: review.rating,
      reviewText: review.reviewText,
      likedByProvider: review.likedByProvider,
      created_at: review.created_at.toISOString(),
    };
  }

  private static mapUserId(
    userId: IReview["userId"]
  ): ReviewUserSnippet | string {
    if (userId instanceof mongoose.Types.ObjectId) {
      return userId.toString();
    }

    if (typeof userId === "object" && userId !== null && "_id" in userId) {
      const populated = userId as mongoose.Types.ObjectId & {
        name?: string;
        profilePhoto?: string;
      };
      return {
        _id: populated._id.toString(),
        name: populated.name ?? "",
        profilePhoto: populated.profilePhoto,
      };
    }

    return String(userId);
  }
}
