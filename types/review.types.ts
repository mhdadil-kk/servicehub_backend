import mongoose from "mongoose";

export interface IReview {
  _id?: mongoose.Types.ObjectId;
  id: string;
  bookingId: string | mongoose.Types.ObjectId;
  providerId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; profilePhoto?: string };
  rating: number;
  reviewText: string;
  likedByProvider: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
