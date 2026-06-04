import mongoose from "mongoose";
import Message from "../models/message.model";
import Booking from "../models/booking.model";
import Conversation from "../models/conversation.model";
import ProviderProfile from "../models/providerProfile.model";
import { IMessage } from "../types/chat.types";
import { NotFoundError, BadRequestError } from "../utils/error";

export class ChatService {
  /**
   * Look up the provider participant in a conversation and return their
   * service category name and profile photo from ProviderProfile.
   */
  private async resolveProviderInfo(participants: any[]): Promise<{ serviceName: string, profilePhoto?: string }> {
    try {
      const providerParticipant = participants.find((p: any) => p.role === "provider");
      if (!providerParticipant) return { serviceName: "Service Provider" };

      const profile = await ProviderProfile.findOne({ userId: providerParticipant._id })
        .populate("serviceId", "name");

      return {
        serviceName: (profile as any)?.serviceId?.name || "Service Provider",
        profilePhoto: profile?.profilePhoto
      };
    } catch {
      return { serviceName: "Service Provider" };
    }
  }

  /**
   * Fetch all conversations for a user (no self-healing — conversations are
   * created at booking-creation time and via explicit chat initiation).
   */
  async getConversations(userId: string, _role: string): Promise<any[]> {
    // Fetch conversations where user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name email role")
      .populate({
        path: "bookingId",
        populate: { path: "serviceId", select: "name" }
      })
      .sort({ updatedAt: -1 });

    // For each conversation, attach last message + unread count + provider info
    const results = await Promise.all(
      conversations.map(async (c: any) => {
        const lastMsg = await Message.findOne({ conversationId: c._id })
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          senderId: { $ne: userId },
          read: false
        });

        const providerInfo = await this.resolveProviderInfo(c.participants);
        const obj = c.toObject();
        
        // Attach profile photo to the provider participant object
        const pIndex = obj.participants.findIndex((p: any) => p.role === "provider");
        if (pIndex >= 0 && providerInfo.profilePhoto) {
          obj.participants[pIndex].profilePhoto = providerInfo.profilePhoto;
        }

        return {
          ...obj,
          lastMessage: lastMsg,
          unreadCount,
          providerServiceName: providerInfo.serviceName
        };
      })
    );

    // Sort by most recent message / updated time
    return results.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
  }

  /**
   * Create or fetch a conversation between two users.
   * First checks for ANY existing conversation between them (booking-linked or direct).
   * If multiple exist, returns the most recently active one.
   * Only creates a new direct conversation if absolutely none exists.
   */
  async getOrCreateDirectConversation(userId: string, targetUserId: string): Promise<any> {
    const userObjId   = new mongoose.Types.ObjectId(userId);
    const targetObjId = new mongoose.Types.ObjectId(targetUserId);

    // Look for ANY existing conversation between these two users
    const existing = await Conversation.find({
      participants: { $all: [userObjId, targetObjId], $size: 2 }
    })
      .populate("participants", "name email role")
      .populate({ path: "bookingId", populate: { path: "serviceId", select: "name" } })
      .sort({ updatedAt: -1 });

    if (existing.length > 0) {
      const conv = existing[0].toObject();
      const providerInfo = await this.resolveProviderInfo(existing[0].participants);
      
      const pIndex = conv.participants.findIndex((p: any) => p.role === "provider");
      if (pIndex >= 0 && providerInfo.profilePhoto) {
        conv.participants[pIndex].profilePhoto = providerInfo.profilePhoto;
      }
      
      conv.providerServiceName = providerInfo.serviceName;
      return conv;
    }

    // No conversation at all — create a fresh direct one with sorted IDs
    const sorted = [userObjId, targetObjId]
      .sort((a, b) => a.toString().localeCompare(b.toString()));

    const created = await Conversation.create({
      participants: sorted,
      bookingId: null
    });

    const populated = await Conversation.findById(created._id)
      .populate("participants", "name email role");

    const conv = (populated as any).toObject();
    const providerInfo = await this.resolveProviderInfo(populated!.participants as any[]);
    
    const pIndex = conv.participants.findIndex((p: any) => p.role === "provider");
    if (pIndex >= 0 && providerInfo.profilePhoto) {
      conv.participants[pIndex].profilePhoto = providerInfo.profilePhoto;
    }
    
    conv.providerServiceName = providerInfo.serviceName;
    return conv;
  }


  async getChatHistory(conversationIdOrBookingId: string, userId: string): Promise<IMessage[]> {
    const conversation = await Conversation.findOne({
      $or: [
        { _id: conversationIdOrBookingId },
        { bookingId: conversationIdOrBookingId }
      ]
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      throw new BadRequestError("Access denied");
    }

    return await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  }

  async saveMessage(
    conversationIdOrBookingId: string,
    senderId: string,
    senderRole: "user" | "provider",
    content: string
  ): Promise<IMessage> {
    let conversation = await Conversation.findOne({
      $or: [
        { _id: conversationIdOrBookingId },
        { bookingId: conversationIdOrBookingId }
      ]
    });

    if (!conversation) {
      const booking = await Booking.findById(conversationIdOrBookingId);
      if (booking) {
        const provProfile = await ProviderProfile.findById(booking.providerId);
        if (provProfile) {
          conversation = await Conversation.create({
            participants: [booking.userId, provProfile.userId],
            bookingId: booking._id
          });
        }
      }
    }

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const message = new Message({
      conversationId: conversation._id,
      bookingId: conversation.bookingId || undefined,
      senderId,
      senderRole,
      content,
      read: false,
      delivered: false
    });

    const savedMsg = await message.save();

    // Touch conversation to update updatedAt timestamp
    await Conversation.findByIdAndUpdate(conversation._id, { updatedAt: new Date() });

    return savedMsg;
  }

  async markAsRead(conversationIdOrBookingId: string, userId: string): Promise<void> {
    let conversation = await Conversation.findOne({
      $or: [
        { _id: conversationIdOrBookingId },
        { bookingId: conversationIdOrBookingId }
      ]
    });

    if (conversation) {
      await Message.updateMany(
        { conversationId: conversation._id, senderId: { $ne: userId }, read: false },
        { $set: { read: true, delivered: true } }
      );
    }
  }

  async markAsDelivered(userId: string): Promise<string[]> {
    // Find conversations where the user is a participant
    const conversations = await Conversation.find({ participants: userId }).select("_id");
    const conversationIds = conversations.map(c => c._id);

    // Find all un-delivered messages sent TO this user (sender != userId) in these conversations
    const undeliveredMessages = await Message.find({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      delivered: false
    }).select("conversationId");

    const uniqueConversationIds = Array.from(new Set(undeliveredMessages.map(m => m.conversationId.toString())));

    // Mark them as delivered
    if (uniqueConversationIds.length > 0) {
      await Message.updateMany(
        { 
          conversationId: { $in: conversationIds },
          senderId: { $ne: userId },
          delivered: false
        },
        { $set: { delivered: true } }
      );
    }

    return uniqueConversationIds;
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId)) {
      throw new BadRequestError("Access denied");
    }

    // Delete all messages associated with the conversation
    await Message.deleteMany({ conversationId });
    
    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError("Message not found");
    }

    // Only the sender can delete their own message
    if (message.senderId.toString() !== userId) {
      throw new BadRequestError("You can only delete your own messages");
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    return await message.save();
  }
}
