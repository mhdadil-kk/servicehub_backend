import express from "express";
import { ReviewController } from "../controllers/review.controller";
import { ReviewService } from "../services/review.service";
import { ReviewRepository } from "../repositories/review.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { ProviderProfileRepository } from "../repositories/providerProfile.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { ROUTES } from "../constants/routes";
import { validate } from "../middlewares/validate.middleware";
import { CreateReviewSchema, GetProviderReviewsSchema } from "../dtos/review.dto";


const router = express.Router();

const reviewRepository = new ReviewRepository();
const bookingRepository = new BookingRepository();
const providerProfileRepository = new ProviderProfileRepository();
const reviewService = new ReviewService(
  reviewRepository,
  bookingRepository,
  providerProfileRepository
);
const reviewController = new ReviewController(reviewService);

router.post(
  ROUTES.REVIEWS.CREATE,
  authMiddleware,
  validate(CreateReviewSchema),
  reviewController.createReview
);
router.get(
  ROUTES.REVIEWS.BY_PROVIDER,
  validate(GetProviderReviewsSchema),
  reviewController.getProviderReviews
);
router.patch(ROUTES.REVIEWS.LIKE,
  authMiddleware,
  roleMiddleware(["provider"]),
  reviewController.likeReview
);

export default router;