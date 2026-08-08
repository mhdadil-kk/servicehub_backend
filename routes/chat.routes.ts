import { Router } from "express";
import { chatService } from "../di/container"; 
import { ChatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth.middleware";


import { uploadChatImage } from "../middlewares/upload.middleware";

const router = Router();
const chatController = new ChatController(chatService);

router.use(authMiddleware);

router.post("/upload-image", uploadChatImage.single("image"), chatController.uploadImage);
router.get("/conversations", chatController.getConversations);
router.post("/conversations", chatController.getOrCreateDirectConversation);
router.delete("/conversations/:conversationId", chatController.deleteConversation);
router.delete("/messages/:messageId", chatController.deleteMessage);
router.get("/:conversationId", chatController.getChatHistory);
router.patch("/:conversationId/read", chatController.markAsRead);
router.patch("/delivered", chatController.markAsDelivered);

export default router;