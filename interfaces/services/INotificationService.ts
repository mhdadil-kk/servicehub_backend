import { INotification } from "../../types/notification.types";

export interface INotificationService {
    getByUserId(userId: string): Promise<{
        notifications: INotification[];
        unreadCount: number;
    }>;
    markAsRead(id: string, userId: string): Promise<INotification>;
    markAllAsRead(userId: string): Promise<void>;
    create(data: {
        userId: string;
        title: string;
        message: string;
        type?: INotification["type"];
        relatedId?: string;
    }): Promise<INotification>;
}
