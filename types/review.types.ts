export interface ReviewUserSnippet {
  _id: string;
  name: string;
  profilePhoto?: string;
}

/** API response shape — aligned with frontend `Review` type */
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

export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
