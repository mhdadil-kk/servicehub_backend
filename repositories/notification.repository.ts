import mongoose, { FilterQuery } from "mongoose";
import NotificationModel from "../models/notification.model";
import { INotification } from "../types/notification.types";
import { BaseRepository } from "./base.repository";

import { INotificationRepository } from "../interfaces/repositories/INotificationRepository";

export class NotificationRepository
  extends BaseRepository<INotification>
  implements INotificationRepository
{
   constructor(){
    super(NotificationModel)
   } 

   async findByUserId(userId: string, limit = 50): Promise<INotification[]> {
       return this.model
         .find({ userId } as FilterQuery<INotification>)
         .sort({ createdAt: -1 })
         .limit(limit)
         .exec();
   }

   async countUnread(userId: string): Promise<number> {
       return this.model.countDocuments({ userId, isRead: false } as FilterQuery<INotification>).exec();
   }

   async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, userId } as FilterQuery<INotification>,
        { isRead: true },
        { returnDocument: "after" }
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.model
      .updateMany({ userId, isRead: false } as FilterQuery<INotification>, { isRead: true })
      .exec();
  }

  async create(data: Partial<INotification>): Promise<INotification>;
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: INotification["type"];
    relatedId?: string;
  }): Promise<INotification>;
  async create(
    data:
      | Partial<INotification>
      | {
          userId: string;
          title: string;
          message: string;
          type?: INotification["type"];
          relatedId?: string;
        }
  ): Promise<INotification> {
    const normalized: Partial<INotification> = {
      title: data.title,
      message: data.message,
      type: data.type,
    };

    if (typeof data.userId === "string") {
      normalized.userId = new mongoose.Types.ObjectId(data.userId);
    } else if (data.userId) {
      normalized.userId = data.userId;
    }

    if (typeof data.relatedId === "string") {
      normalized.relatedId = new mongoose.Types.ObjectId(data.relatedId);
    } else if (data.relatedId) {
      normalized.relatedId = data.relatedId;
    }

    return super.create(normalized);
  }
}  
