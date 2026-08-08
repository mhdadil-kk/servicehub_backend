import { Router } from "express";
import { reviewService } from "../di/container"; 
import { ReviewController } from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { ROUTES } from "../constants/routes";
import { validate } from "../middlewares/validate.middleware";
import { CreateReviewSchema, GetProviderReviewsSchema } from "../dtos/review.dto";

const router = Router();
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
  roleMiddleware("provider"),
  reviewController.likeReview
);

export default router;