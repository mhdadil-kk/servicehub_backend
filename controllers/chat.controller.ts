import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";

export class ChatController {
  private _chatService: ChatService;

  constructor() {
    this._chatService = new ChatService();
  }

  getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;
      const conversations = await this._chatService.getConversations(userId, role);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(conversations));
    } catch (error) {
      next(error);
    }
  };

  getOrCreateDirectConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { targetUserId } = (req as any).body;
      const conversation = await this._chatService.getOrCreateDirectConversation(userId, targetUserId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(conversation));
    } catch (error) {
      next(error);
    }
  };

  getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { bookingId } = req.params as { bookingId: string }; // Can be conversationId or bookingId

      const history = await this._chatService.getChatHistory(bookingId, userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(history));
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { bookingId } = req.params as { bookingId: string }; // Can be conversationId or bookingId

      await this._chatService.markAsRead(bookingId, userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Messages marked as read"));
    } catch (error) {
      next(error);
    }
  };

  deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { conversationId } = req.params;

      await this._chatService.deleteConversation(conversationId, userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Conversation deleted successfully"));
    } catch (error) {
      next(error);
    }
  };
}
