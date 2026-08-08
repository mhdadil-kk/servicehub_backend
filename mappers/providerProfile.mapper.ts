import { IProviderDocument, IProviderProfile } from "../types/providerProfile.types";
import { generateSignedUrl, extractPublicId } from "../utils/cloudinary.utils";

export interface ProviderDocumentDTO {
  docType: string;
  url: string;
}

export interface ProviderProfileResponseDTO {
  _id: string;
  userId: string | Record<string, unknown>;
  bio?: string;
  profilePhoto?: string;
  serviceId?: string | Record<string, unknown>;
  hourlyRate?: number;
  serviceRadius?: number;
  address?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  documents: ProviderDocumentDTO[];
  bankDetails?: Record<string, unknown>;
  onboardingStep: number;
  onboardingStatus: string;
  rejectionReason?: string;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProviderProfileDTO {
  _id: string;
  userId: string | Record<string, unknown>;
  bio?: string;
  profilePhoto?: string;
  serviceId?: string | Record<string, unknown>;
  hourlyRate?: number;
  serviceRadius?: number;
  address?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  averageRating?: number;
  totalReviews?: number;
  user?: string;
  service?: string;
}

export class ProviderProfileMapper {
  static toResponse(profile: IProviderProfile & { toObject?: () => IProviderProfile }): ProviderProfileResponseDTO | null {
    if (!profile) return null;

    const p = typeof profile.toObject === 'function' ? profile.toObject() : profile;

    const result: ProviderProfileResponseDTO = {
      _id: (p as IProviderProfile & { _id?: { toString: () => string }; id?: string })._id?.toString() || (p as IProviderProfile & { id?: string }).id || "",
      userId: p.userId as unknown as string,
      bio: p.bio,
      profilePhoto: p.profilePhoto,
      hourlyRate: p.hourlyRate,
      serviceRadius: p.serviceRadius,
      address: p.address,
      location: p.location,
      bankDetails: p.bankDetails as unknown as Record<string, unknown>,
      documents: p.documents ? p.documents.map((doc: IProviderDocument) => {
        const publicId = extractPublicId(doc.url);
        return {
          docType: doc.docType,
          url: publicId ? generateSignedUrl(publicId, 3600) : doc.url,
        };
      }) : [],
      onboardingStep: p.onboardingStep,
      onboardingStatus: p.onboardingStatus,
      rejectionReason: p.rejectionReason,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      createdAt: new Date(p.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(p.updatedAt || Date.now()).toISOString(),
    };

    if (p.userId && typeof p.userId === 'object' && ('name' in p.userId || 'email' in p.userId || '_id' in p.userId)) {
      const u = p.userId as unknown as { _id?: { toString: () => string }; name?: string; email?: string; phone?: string; profilePhoto?: string };
      result.userId = {
        _id: u._id?.toString() || (u as unknown as { toString: () => string }).toString(),
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        profilePhoto: u.profilePhoto,
      };
    } else {
      result.userId = (p.userId as unknown as { toString: () => string })?.toString();
    }

    if (p.serviceId && typeof p.serviceId === 'object' && ('name' in p.serviceId || 'description' in p.serviceId || '_id' in p.serviceId)) {
      const s = p.serviceId as unknown as { _id?: { toString: () => string }; name?: string; description?: string };
      result.serviceId = {
        _id: s._id?.toString() || (s as unknown as { toString: () => string }).toString(),
        name: s.name,
        description: s.description,
      };
    } else {
      result.serviceId = (p.serviceId as unknown as { toString: () => string })?.toString();
    }

    return result;
  }

  static toPublicResponse(profile: IProviderProfile & { toObject?: () => IProviderProfile }): PublicProviderProfileDTO | null {
    if (!profile) return null;

    const p = typeof profile.toObject === 'function' ? profile.toObject() : profile;
    
    const result: PublicProviderProfileDTO = {
      _id: (p as IProviderProfile & { _id?: { toString: () => string }; id?: string })._id?.toString() || (p as IProviderProfile & { id?: string }).id || "",
      userId: p.userId as unknown as string,
      bio: p.bio,
      profilePhoto: p.profilePhoto,
      hourlyRate: p.hourlyRate,
      serviceRadius: p.serviceRadius,
      address: p.address,
      location: p.location,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
    };

    if (p.userId && typeof p.userId === 'object' && ('name' in p.userId || 'email' in p.userId || '_id' in p.userId)) {
      const u = p.userId as unknown as { _id?: { toString: () => string }; name?: string; email?: string; phone?: string; profilePhoto?: string };
      result.userId = {
        _id: u._id?.toString() || (u as unknown as { toString: () => string }).toString(),
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        profilePhoto: u.profilePhoto,
      };
    } else {
      result.userId = (p.userId as unknown as { toString: () => string })?.toString();
    }

    if (p.serviceId && typeof p.serviceId === 'object' && ('name' in p.serviceId || 'description' in p.serviceId || '_id' in p.serviceId)) {
      const s = p.serviceId as unknown as { _id?: { toString: () => string }; name?: string; description?: string };
      result.serviceId = {
        _id: s._id?.toString() || (s as unknown as { toString: () => string }).toString(),
        name: s.name,
        description: s.description,
      };
    } else {
      result.serviceId = (p.serviceId as unknown as { toString: () => string })?.toString();
    }

    return result;
  }

  static toArrayResponse(profiles: (IProviderProfile & { toObject?: () => IProviderProfile })[], isPublic: boolean = false): (ProviderProfileResponseDTO | PublicProviderProfileDTO)[] {
    return profiles.map(p => isPublic ? this.toPublicResponse(p)! : this.toResponse(p)!);
  }
}
