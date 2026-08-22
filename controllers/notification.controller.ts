import { Request, Response } from "express";
import { INotificationService } from "../interfaces/services/INotificationService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { asyncHandler } from "../utils/async-handler";

export class NotificationController {
  constructor(private _notificationService: INotificationService) {}

  getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { notifications, unreadCount } = await this._notificationService.getByUserId(userId);

    res.status(HttpStatusCode.OK).json(createSuccessResponse({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    }));
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await this._notificationService.markAsRead(id as string, userId);

    res.status(HttpStatusCode.OK).json(createSuccessResponse(notification));
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await this._notificationService.markAllAsRead(userId);
    
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, SUCCESS_MESSAGES.OPERATION_SUCCESS)
    );
  });
}