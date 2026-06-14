import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const notificationController = new NotificationController();

router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
