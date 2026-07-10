import { INotificationRepository } from "../interfaces/repositories/INotificationRepository";
import { INotification } from "../types/notification.types";
import { NotFoundError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { INotificationService } from "../interfaces/services/INotificationService";


export class NotificationService implements INotificationService {
    private  _notificationRepository: INotificationRepository;

    constructor(notificationRepository :INotificationRepository){
      this._notificationRepository = notificationRepository
    }

    async getByUserId(userId: string){
      const [notifications,unreadCount] = await Promise.all([
        this._notificationRepository.findByUserId(userId),
        this._notificationRepository.countUnread(userId),
      ]);
      return {notifications,unreadCount}
    }

    async markAsRead(id: string, userId: string): Promise<INotification> {
      const notification = await this._notificationRepository.markAsRead(id,userId);
      
      if(!notification){
        throw new NotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
      }

      return  notification
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this._notificationRepository.markAllAsRead(userId);
    }

    async create(data: {
        userId: string;
        title: string;
        message: string;
        type?: INotification['type'];
        relatedId?: string;
    }): Promise<INotification>{
        return this._notificationRepository.create(data);
    }
}