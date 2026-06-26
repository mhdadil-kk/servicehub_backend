import { Request,Response,NextFunction } from "express";
import { INotificationService } from "../interfaces/services/INotificationService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class NotificationController {
  private readonly _notificationService: INotificationService;

  constructor(notificationService: INotificationService){
    this._notificationService = notificationService;
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) =>{
    try{
      const userId = req.user!.id;
      const result = await this._notificationService.getByUserId(userId);

      res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
    }catch(error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction)=>{
    try{
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this._notificationService.markAsRead(id,userId);

      res.status(HttpStatusCode.OK).json(createSuccessResponse(notification));
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