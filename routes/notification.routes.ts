import { Router } from "express";
import { notificationService } from "../di/container"; 
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const notificationController = new NotificationController(notificationService);

router.use(authMiddleware);

router.get(ROUTES.NOTIFICATIONS.LIST, notificationController.getNotifications);
router.patch(ROUTES.NOTIFICATIONS.MARK_ALL_READ, notificationController.markAllAsRead);
router.patch(ROUTES.NOTIFICATIONS.MARK_READ, notificationController.markAsRead);

export default router;
