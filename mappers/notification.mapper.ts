import { INotification } from "../types/notification.types";

export interface NotificationResponseDTO {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export class NotificationMapper {
  static toResponse(notification: INotification | any): NotificationResponseDTO | null {
    if (!notification) return null;

    const n = typeof notification.toObject === 'function' ? notification.toObject() : notification;

    return {
      _id: n._id.toString(),
      userId: n.userId.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      relatedId: n.relatedId?.toString(),
      createdAt: new Date(n.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(n.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(notifications: any[]): NotificationResponseDTO[] {
    return notifications.map(notif => this.toResponse(notif)!);
  }
}
