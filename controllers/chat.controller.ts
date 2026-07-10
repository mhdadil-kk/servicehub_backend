import { Request, Response, NextFunction } from "express";
import { IChatService } from "../interfaces/services/IChatService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { ConversationMapper } from "../mappers/conversation.mapper";
import { MessageMapper } from "../mappers/message.mapper";

export class ChatController {
  private  _chatService: IChatService;
  constructor(chatService: IChatService) {
    this._chatService = chatService;
  }

  getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversations = await this._chatService.getConversations(req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(ConversationMapper.toArrayResponse(conversations, true), SUCCESS_MESSAGES.CONVERSATIONS_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getOrCreateDirectConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversation = await this._chatService.getOrCreateDirectConversation(
        req.user!.id,
        req.body.targetUserId
      );
      res.status(HttpStatusCode.OK).json(createSuccessResponse(ConversationMapper.toDetailedResponse(conversation)));
    } catch (error) {
      next(error);
    }
  };

  getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this._chatService.getChatHistory(req.params.bookingId, req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(MessageMapper.toArrayResponse(history), SUCCESS_MESSAGES.CHAT_HISTORY_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this._chatService.markAsRead(req.params.bookingId, req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.MESSAGES_MARKED_READ)
      );
    } catch (error) {
      next(error);
    }
  };

  deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this._chatService.deleteConversation(req.params.conversationId, req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.CONVERSATION_DELETED)
      );
    } catch (error) {
      next(error);
    }
  };
}