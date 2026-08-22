import { Router } from "express";
import { chatService } from "../di/container";
import { ChatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadChatImage } from "../middlewares/upload.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const chatController = new ChatController(chatService);

router.use(authMiddleware);

router.post(ROUTES.CHAT.UPLOAD_IMAGE, uploadChatImage.single("image"), chatController.uploadImage);
router.get(ROUTES.CHAT.CONVERSATIONS, chatController.getConversations);
router.post(ROUTES.CHAT.CONVERSATIONS, chatController.getOrCreateDirectConversation);
router.delete(ROUTES.CHAT.CONVERSATION_BY_ID, chatController.deleteConversation);
router.delete(ROUTES.CHAT.MESSAGE_BY_ID, chatController.deleteMessage);
router.get(ROUTES.CHAT.HISTORY, chatController.getChatHistory);
router.patch(ROUTES.CHAT.MARK_READ, chatController.markAsRead);
router.patch(ROUTES.CHAT.MARK_DELIVERED, chatController.markAsDelivered);

export default router;