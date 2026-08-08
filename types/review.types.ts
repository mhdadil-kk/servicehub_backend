export interface IReview {
  id: string;
  bookingId: string;
  providerId: string;
  userId: string;
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

export interface ReviewUserSnippet {
  _id: string;
  name: string;
  profilePhoto?: string;
}

export interface ReviewResponse {
  _id: string;
  bookingId: string;
  providerId: string;
  userId: ReviewUserSnippet | string;
  rating: number;
  reviewText: string;
  likedByProvider: boolean;
  created_at: string;
}
