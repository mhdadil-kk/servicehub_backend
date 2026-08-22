import { INotification } from "../../types/notification.types";
import { NotificationResponseDTO } from "../../dtos/notification.dto";

export interface INotificationService {
  getByUserId(userId: string): Promise<{
    notifications: NotificationResponseDTO[];
    unreadCount: number;
  }>;
  markAsRead(id: string, userId: string): Promise<NotificationResponseDTO>;
  markAllAsRead(userId: string): Promise<void>;
  create(data: {
    userId: string;
    title: string;
    message: string;
    type?: INotification["type"];
    relatedId?: string;
  }): Promise<NotificationResponseDTO>;
}
