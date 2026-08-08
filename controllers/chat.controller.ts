import { Request, Response } from "express";
import { IChatService } from "../interfaces/services/IChatService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { asyncHandler } from "../utils/async-handler";


export class ChatController {
  constructor(private _chatService: IChatService) {}

  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new Error("No image provided");
    }
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse({ 
        imageUrl: req.file.path, 
        imagePublicId: req.file.filename 
      }, "Image uploaded successfully")
    );
  });

  deleteConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    await this._chatService.deleteConversation(conversationId, userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Conversation deleted"));
  });

  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const messageId = req.params.messageId as string;
    await this._chatService.deleteMessage(messageId, userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Message deleted"));
  });

  getConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversations = await this._chatService.getConversations(userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(conversations));
  });

  getOrCreateDirectConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { targetUserId } = req.body;
    const conversation = await this._chatService.getOrCreateDirectConversation(userId, targetUserId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(conversation));
  });

  getChatHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    const messages = await this._chatService.getChatHistory(conversationId, userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(messages));
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;
    await this._chatService.markAsRead(conversationId, userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Messages marked as read"));
  });

  markAsDelivered = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await this._chatService.markAsDelivered(userId);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result, "Messages marked as delivered"));
  });
}