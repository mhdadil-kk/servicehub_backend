import ConversationModel, { IConversationDocument } from "../models/conversation.model";
import { IConversation } from "../types/chat.types";
import { BaseRepository } from "./base.repository";

import mongoose, { FilterQuery } from "mongoose";
import { IConversationRepository } from "../interfaces/repositories/IConversationRepository";

export class ConversationRepository
  extends BaseRepository<IConversationDocument>
  implements IConversationRepository
{
  constructor() {
    super(ConversationModel);
  }

  isParticipant(conversation: IConversation, userId: string): boolean {
    return conversation.participants.some((p: unknown) => {
      const idStr = p && (p as { _id?: unknown })._id ? String((p as { _id?: unknown })._id) : String(p);
      return idStr === userId;
    });
  }

  async findByParticipants(participantIds: string[]): Promise<IConversation | null> {
    const objectIds = participantIds.map((id) => new mongoose.Types.ObjectId(id));
    return this.model
      .findOne({ participants: { $all: objectIds, $size: 2 } } as FilterQuery<IConversationDocument>)
      .exec() as unknown as IConversation | null;
  }

  async createForBooking(participantIds: string[], bookingId: string): Promise<IConversation> {
    const sorted = participantIds
      .map((id) => new mongoose.Types.ObjectId(id))
      .sort((a, b) => a.toString().localeCompare(b.toString()));

    return this.create({ participants: sorted, bookingId } as unknown as Partial<IConversationDocument>) as unknown as IConversation;
  }

  async attachBooking(conversationId: string, bookingId: string): Promise<IConversation | null> {
    return this.update(conversationId, { bookingId } as unknown as Partial<IConversationDocument>) as unknown as IConversation | null;
  }

  async findByUserIdPopulated(userId: string): Promise<IConversation[]> {
    return this.model
      .find({ participants: userId } as FilterQuery<IConversationDocument>)
      .populate("participants", "name email role")
      .populate({ path: "bookingId", populate: { path: "serviceId", select: "name" } })
      .sort({ updatedAt: -1 })
      .exec() as unknown as IConversation[];
  }

  async findDirectBetweenUsers(userId: string, targetUserId: string): Promise<IConversation[]> {
    const ids = [userId, targetUserId].map((id) => new mongoose.Types.ObjectId(id));
    return this.model
      .find({ participants: { $all: ids, $size: 2 } } as FilterQuery<IConversationDocument>)
      .populate("participants", "name email role")
      .populate({ path: "bookingId", populate: { path: "serviceId", select: "name" } })
      .sort({ updatedAt: -1 })
      .exec() as unknown as IConversation[];
  }

  async createDirect(participantIds: string[]): Promise<IConversation> {
    const sorted = participantIds
      .map((id) => new mongoose.Types.ObjectId(id))
      .sort((a, b) => a.toString().localeCompare(b.toString()));

    return this.create({ participants: sorted, bookingId: null } as unknown as Partial<IConversationDocument>) as unknown as IConversation;
  }

  async findByIdOrBookingIdPopulated(id: string): Promise<IConversation | null> {
    return this.model
      .findOne({ $or: [{ _id: id }, { bookingId: id }] } as FilterQuery<IConversationDocument>)
      .populate("participants", "name email role")
      .exec() as unknown as IConversation | null;
  }

  async findById(id: string): Promise<IConversation | null> {
    return super.findById(id) as unknown as IConversation | null;
  }

  async touchUpdatedAt(conversationId: string): Promise<void> {
    await this.model.findByIdAndUpdate(conversationId, { updatedAt: new Date() }).exec();
  }

  async deleteById(conversationId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: conversationId } as FilterQuery<IConversationDocument>).exec();
    return result.deletedCount > 0;
  }
}
