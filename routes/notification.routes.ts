import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { NotificationService } from "../services/notification.service";
import { NotificationRepository } from "../repositories/notification.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const notificationRepository = new NotificationRepository()
const notificationService = new NotificationService(notificationRepository)
const notificationController = new NotificationController(notificationService);


router.use(authMiddleware);

router.get(ROUTES.NOTIFICATIONS.LIST, notificationController.getNotifications);
router.patch(ROUTES.NOTIFICATIONS.MARK_ALL_READ, notificationController.markAllAsRead);
router.patch(ROUTES.NOTIFICATIONS.MARK_READ, notificationController.markAsRead);

export default router;
