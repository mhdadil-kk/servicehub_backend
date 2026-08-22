import { INotification } from "../types/notification.types";
import { NotificationResponseDTO } from "../dtos/notification.dto";

export class NotificationMapper {
  static toResponse(notification: INotification & { toObject?: () => INotification }): NotificationResponseDTO | null {
    if (!notification) return null;

    const n = typeof notification.toObject === 'function' ? notification.toObject() : notification;

    return {
      _id: n._id?.toString() || n.id || "",
      userId: n.userId ? n.userId.toString() : "",
      title: n.title,
      message: n.message,
      type: n.type || "system",
      isRead: n.isRead,
      relatedId: n.relatedId ? n.relatedId.toString() : undefined,
      createdAt: new Date(n.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(n.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(notifications: (INotification & { toObject?: () => INotification })[]): NotificationResponseDTO[] {
    return notifications.map(notif => this.toResponse(notif)!);
  }
}
