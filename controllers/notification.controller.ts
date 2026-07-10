import { Request,Response,NextFunction } from "express";
import { INotificationService } from "../interfaces/services/INotificationService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { NotificationMapper } from "../mappers/notification.mapper";

export class NotificationController {
  private  _notificationService: INotificationService;

  constructor(notificationService: INotificationService){
    this._notificationService = notificationService;
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) =>{
    try{
      const userId = req.user!.id;
      const { notifications, unreadCount } = await this._notificationService.getByUserId(userId);

      res.status(HttpStatusCode.OK).json(createSuccessResponse({
        notifications: NotificationMapper.toArrayResponse(notifications || []),
        unreadCount: unreadCount || 0
      }));
    } catch(error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction)=>{
    try{
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this._notificationService.markAsRead(id,userId);

      res.status(HttpStatusCode.OK).json(createSuccessResponse(NotificationMapper.toResponse(notification)));
    }catch(error){
      next(error)
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction)=>{
    try{
      const userId = req.user!.id;
      await this._notificationService.markAllAsRead(userId);
      
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null,SUCCESS_MESSAGES.OPERATION_SUCCESS)
      )
    }catch(error){
      next(error)
    }
    
  }
}