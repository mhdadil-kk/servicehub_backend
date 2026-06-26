import { INotification } from "../../types/notification.types";

export interface INotificationRepository {
    findByUserId(userId: string, limit?: number): Promise<INotification[]>;
    countUnread(userId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<INotification | null>;
    markAllAsRead(userId: string): Promise<void>;
    create(data: {
        userId: string;
        title: string;
        message: string;
        type?: INotification["type"];
        relatedId?: string;
    }): Promise<INotification>;
}
