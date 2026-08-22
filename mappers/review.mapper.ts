import mongoose from "mongoose";
import { IReview } from "../types/review.types";
import { ReviewResponseDTO, ReviewUserSnippetDTO } from "../dtos/review.dto";

export class ReviewMapper {
  static toResponse(
    review: (IReview & { toObject?: () => IReview }) | null
  ): ReviewResponseDTO | null {
    if (!review) return null;

    const r = typeof review.toObject === "function" ? review.toObject() : review;

    return {
      _id: r._id?.toString() || r.id || "",
      bookingId: r.bookingId ? r.bookingId.toString() : "",
      providerId: r.providerId ? r.providerId.toString() : "",
      userId: ReviewMapper.mapUserId(r.userId),
      rating: r.rating,
      reviewText: r.reviewText,
      likedByProvider: r.likedByProvider,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  private static mapUserId(
    userId: IReview["userId"]
  ): ReviewUserSnippetDTO | string {
    if (userId instanceof mongoose.Types.ObjectId) {
      return userId.toString();
    }

    if (typeof userId === "object" && userId !== null && "_id" in userId) {
      const populated = userId;
      return {
        _id: populated._id.toString(),
        name: populated.name ?? "",
        profilePhoto: populated.profilePhoto,
      };
    }

    return String(userId);
  }
}
