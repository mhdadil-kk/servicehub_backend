import MessageModel, { IMessageDocument } from "../models/message.model";
import { IMessage } from "../types/chat.types";
import { BaseRepository } from "./base.repository";
import { IMessageRepository } from "../interfaces/repositories/IMessageRepository";
import { FilterQuery } from "mongoose";

export class MessageRepository
  extends BaseRepository<IMessageDocument>
  implements IMessageRepository
{
  constructor() {
    super(MessageModel);
  }

  async createBookingCardMessage(data: {
    conversationId: string;
    bookingId: string;
    senderId: string;
    senderRole: "user" | "provider";
  }): Promise<IMessageDocument> {
    return this.create({
      conversationId: data.conversationId,
      bookingId: data.bookingId,
      senderId: data.senderId,
      senderRole: data.senderRole,
      messageType: "booking_card",
      content: "Booking created",
      read: false,
    } as unknown as Partial<IMessageDocument>);
  }

  async findLastByConversationId(conversationId: string): Promise<IMessage | null> {
    return this.model
      .findOne({ conversationId } as FilterQuery<IMessageDocument>)
      .sort({ createdAt: -1 })
      .exec();
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    return this.count({
      conversationId,
      senderId: { $ne: userId },
      read: false,
    } as FilterQuery<IMessageDocument>);
  }

  async findByConversationId(conversationId: string): Promise<IMessage[]> {
    return this.model
      .find({ conversationId } as FilterQuery<IMessageDocument>)
      .sort({ createdAt: 1 })
      .exec();
  }

  async createTextMessage(data: {
    conversationId: string;
    bookingId?: string | null;
    senderId: string;
    senderRole: "user" | "provider";
    content: string;
  }): Promise<IMessageDocument> {
    return this.create({
      conversationId: data.conversationId,
      bookingId: data.bookingId ?? undefined,
      senderId: data.senderId,
      senderRole: data.senderRole,
      content: data.content,
      messageType: "text",
      read: false,
      delivered: false,
    } as unknown as Partial<IMessageDocument>);
  }

  async createImageMessage(data: {
    conversationId: string;
    bookingId?: string | null;
    senderId: string;
    senderRole: "user" | "provider";
    imageUrl: string;
    imagePublicId: string;
  }): Promise<IMessageDocument> {
    return this.create({
      conversationId: data.conversationId,
      bookingId: data.bookingId ?? undefined,
      senderId: data.senderId,
      senderRole: data.senderRole,
      messageType: "image",
      content: "📷 Image",   
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
      read: false,
      delivered: false,
    } as unknown as Partial<IMessageDocument>);
  }

  async markReadByConversation(conversationId: string, userId: string): Promise<void> {
    await this.model
      .updateMany(
        { conversationId, senderId: { $ne: userId }, read: false } as FilterQuery<IMessageDocument>,
        { $set: { read: true, delivered: true } }
      )
      .exec();
  }

  async markDeliveredForUserInConversations(conversationIds: string[], userId: string): Promise<void> {
    if (conversationIds.length === 0) return;
    await this.model
      .updateMany(
        {
          conversationId: { $in: conversationIds },
          senderId: { $ne: userId },
          delivered: false,
        } as FilterQuery<IMessageDocument>,
        { $set: { delivered: true } }
      )
      .exec();
  }

  async findUndeliveredConversationIds(userId: string, conversationIds: string[]): Promise<string[]> {
    if (conversationIds.length === 0) return [];
    const messages = await this.model
      .find({
        conversationId: { $in: conversationIds },
        senderId: { $ne: userId },
        delivered: false,
      } as FilterQuery<IMessageDocument>)
      .select("conversationId")
      .exec();
    return Array.from(new Set(messages.map((m) => m.conversationId.toString())));
  }

  async softDeleteMessage(messageId: string, userId: string): Promise<IMessage | null> {
    const message = await this.model.findById(messageId).exec();
    if (!message || message.senderId.toString() !== userId) return null;
    return this.update(messageId, { isDeleted: true, content: "This message was deleted" } as unknown as Partial<IMessageDocument>) as unknown as IMessage | null;
  }

  async findById(messageId: string): Promise<IMessageDocument | null> {
    return this.model.findById(messageId).exec();
  }

  async updateById(messageId: string, data: Partial<IMessageDocument>): Promise<IMessage | null> {
    return this.model.findByIdAndUpdate(messageId, data, { returnDocument: "after" }).exec();
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await this.model.deleteMany({ conversationId } as FilterQuery<IMessageDocument>).exec();
  }
}
