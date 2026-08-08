import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReviewDocument extends Document {
  bookingId: Types.ObjectId;
  providerId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  reviewText: string;
  likedByProvider: boolean;
  created_at: Date;
  updated_at: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    likedByProvider: { type: Boolean, default: false }
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ReviewSchema.index({ bookingId: 1, userId: 1 }, { unique: true });

export const ReviewModel = mongoose.model<IReviewDocument>("Review", ReviewSchema);
export default ReviewModel;
