import { Request, Response, NextFunction } from "express";
import Notification from "../models/notification.model";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";

export class NotificationController {
  
  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);
      
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });

      res.status(HttpStatusCode.OK).json(createSuccessResponse({
        notifications,
        unreadCount
      }));
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      );

      res.status(HttpStatusCode.OK).json(createSuccessResponse(notification));
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "All notifications marked as read"));
    } catch (error) {
      next(error);
    }
  };
}
