import { INotificationRepository } from "../interfaces/repositories/INotificationRepository";
import { INotification } from "../types/notification.types";
import { NotFoundError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { INotificationService } from "../interfaces/services/INotificationService";
import { NotificationResponseDTO } from "../dtos/notification.dto";
import { NotificationMapper } from "../mappers/notification.mapper";

export class NotificationService implements INotificationService {
  constructor(private _notificationRepository: INotificationRepository) {}

  async getByUserId(userId: string): Promise<{ notifications: NotificationResponseDTO[]; unreadCount: number }> {
    const [notifications, unreadCount] = await Promise.all([
      this._notificationRepository.findByUserId(userId),
      this._notificationRepository.countUnread(userId),
    ]);
    
    return {
      notifications: NotificationMapper.toArrayResponse(notifications), 
      unreadCount 
    };
  }

  async markAsRead(id: string, userId: string): Promise<NotificationResponseDTO> {
    const notification = await this._notificationRepository.markAsRead(id, userId);
    if (!notification) {
      throw new NotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return NotificationMapper.toResponse(notification)!;
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
  }): Promise<NotificationResponseDTO> {
    const notification = await this._notificationRepository.create(data);
    return NotificationMapper.toResponse(notification)!;
  }
}
