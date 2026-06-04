import express from "express";
import { ChatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const chatController = new ChatController();

router.use(authMiddleware);

router.get("/conversations", chatController.getConversations);
router.post("/conversations", chatController.getOrCreateDirectConversation);
router.delete("/conversations/:conversationId", chatController.deleteConversation);
router.get("/:bookingId", chatController.getChatHistory);
router.patch("/:bookingId/read", chatController.markAsRead);

export default router;
