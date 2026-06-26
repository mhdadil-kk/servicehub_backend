import express from "express";
import { ChatController } from "../controllers/chat.controller";
import { ChatService } from "../services/chat.service";
import { ConversationRepository } from "../repositories/conversation.repository";
import { MessageRepository } from "../repositories/message.repository";
import { ProviderProfileRepository } from "../repositories/providerProfile.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { DirectConversationSchema } from "../dtos/chat.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const providerProfileRepository = new ProviderProfileRepository();
const bookingRepository = new BookingRepository();

const chatService = new ChatService(
  conversationRepository,
  messageRepository,
  providerProfileRepository,
  bookingRepository
);
const chatController = new ChatController(chatService);

router.use(authMiddleware);

router.get(ROUTES.CHAT.CONVERSATIONS, chatController.getConversations);
router.post(
  ROUTES.CHAT.CONVERSATIONS,
  validate(DirectConversationSchema),
  chatController.getOrCreateDirectConversation
);
router.delete(ROUTES.CHAT.CONVERSATION_BY_ID, chatController.deleteConversation);
router.get(ROUTES.CHAT.HISTORY, chatController.getChatHistory);
router.patch(ROUTES.CHAT.MARK_READ, chatController.markAsRead);

export default router;
export { chatService };