import { IMessage } from "../types/chat.types";
import { generateSignedUrl, extractPublicId } from "../utils/cloudinary.utils";

export interface MessageResponseDTO {
  _id: string;
  conversationId: string;
  bookingId?: string;
  senderId: string;
  senderRole: string;
  messageType: string;
  content: string;
  imageUrl?: string;   
  read: boolean;
  delivered: boolean;
  isDeleted: boolean;
  bookingId_ref?: string;
  createdAt: string;
  updatedAt: string;
}

export class MessageMapper {
  static toResponse(message: IMessage & { toObject?: () => IMessage }): MessageResponseDTO | null {
    if (!message) return null;

    const m = typeof message.toObject === "function" ? message.toObject() : message;

    let signedImageUrl: string | undefined;

    if (m.messageType === "image" && !m.isDeleted) {
      const publicId = m.imagePublicId || (m.imageUrl ? extractPublicId(m.imageUrl) : null);
      if (publicId) {
        signedImageUrl = generateSignedUrl(publicId, 3600);
      } else {
        signedImageUrl = m.imageUrl;
      }
    }

    return {
      _id: (m as IMessage & { _id?: { toString: () => string }; id?: string })._id?.toString() || (m as IMessage & { id?: string }).id || "",
      conversationId: m.conversationId.toString(),
      bookingId: m.bookingId?.toString(),
      senderId: m.senderId.toString(),
      senderRole: m.senderRole,
      messageType: m.messageType ?? "text",
      content: m.content,
      imageUrl: signedImageUrl,
      read: m.read,
      delivered: m.delivered ?? false,
      isDeleted: m.isDeleted ?? false,
      createdAt: new Date(m.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(m.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(messages: (IMessage & { toObject?: () => IMessage })[]): MessageResponseDTO[] {
    return messages.map((msg) => this.toResponse(msg)!);
  }
}
