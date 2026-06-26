import MessageModel from "../models/message.model";
import { IMessage } from "../types/chat.types";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose";
import { IMessageRepository } from "../interfaces/repositories/IMessageRepository";

export class MessageRepository
  extends BaseRepository<IMessage>
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
  }): Promise<IMessage> {
    return this.create({
      conversationId: data.conversationId,
      bookingId: data.bookingId,
      senderId: data.senderId,
      senderRole: data.senderRole,
      messageType: "booking_card",
      content: "Booking created",
      read: false,
    } as Partial<IMessage>);
  }

  async findLastByConversationId(conversationId: string): Promise<IMessage | null> {
    return this.model
      .findOne({ conversationId } as FilterQuery<IMessage>)
      .sort({ createdAt: -1 })
      .exec();
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    return this.count({
      conversationId,
      senderId: { $ne: userId },
      read: false,
    } as FilterQuery<IMessage>);
  }

  async findByConversationId(conversationId: string): Promise<IMessage[]> {
    return this.model
      .find({ conversationId } as FilterQuery<IMessage>)
      .sort({ createdAt: 1 })
      .exec();
  }

  async createTextMessage(data: {
    conversationId: string;
    bookingId?: string | null;
    senderId: string;
    senderRole: "user" | "provider";
    content: string;
  }): Promise<IMessage> {
    return this.create({
      conversationId: data.conversationId,
      bookingId: data.bookingId ?? undefined,
      senderId: data.senderId,
      senderRole: data.senderRole,
      content: data.content,
      read: false,
      delivered: false,
    } as Partial<IMessage>);
  }

  async markReadByConversation(conversationId: string, userId: string): Promise<void> {
    await this.model
      .updateMany(
        { conversationId, senderId: { $ne: userId }, read: false } as FilterQuery<IMessage>,
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
        } as FilterQuery<IMessage>,
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
      } as FilterQuery<IMessage>)
      .select("conversationId")
      .exec();
    return Array.from(new Set(messages.map((m) => m.conversationId.toString())));
  }

  async softDelete(messageId: string, userId: string): Promise<IMessage | null> {
    const message = await this.model.findById(messageId).exec();
    if (!message || message.senderId.toString() !== userId) return null;
    return this.update(messageId, { isDeleted: true, content: "This message was deleted" });
  }

  async findById(messageId: string): Promise<IMessage | null> {
    return this.model.findById(messageId).exec();
  }

  async updateById(messageId: string, data: Partial<IMessage>): Promise<IMessage | null> {
    return this.model.findByIdAndUpdate(messageId, data, { new: true }).exec();
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await this.model.deleteMany({ conversationId } as FilterQuery<IMessage>).exec();
  }
}