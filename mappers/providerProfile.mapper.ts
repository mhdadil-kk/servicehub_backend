import { IProviderProfile } from "../types/providerProfile.types";
import mongoose from "mongoose";

export interface ProviderDocumentDTO {
  docType: string;
  url: string;
}

export interface ProviderProfileResponseDTO {
  _id: string;
  userId: string;
  bio?: string;
  profilePhoto?: string;
  serviceId?: string;
  hourlyRate?: number;
  serviceRadius?: number;
  address?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  documents: ProviderDocumentDTO[];
  bankDetails?: any;
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
  userId: any;
  bio?: string;
  profilePhoto?: string;
  serviceId?: string;
  hourlyRate?: number;
  serviceRadius?: number;
  address?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  averageRating?: number;
  totalReviews?: number;
  user?: any;
  service?: any;
}

export class ProviderProfileMapper {
  static toResponse(profile: IProviderProfile | any): ProviderProfileResponseDTO | any {
    if (!profile) return null;

    const p = typeof profile.toObject === 'function' ? profile.toObject() : profile;

    const result: any = {
      _id: p._id.toString(),
      bio: p.bio,
      profilePhoto: p.profilePhoto,
      hourlyRate: p.hourlyRate,
      serviceRadius: p.serviceRadius,
      address: p.address,
      location: p.location,
      bankDetails: p.bankDetails,
      documents: p.documents ? p.documents.map((doc: any) => ({
        docType: doc.docType,
        url: doc.url,
      })) : [],
      onboardingStep: p.onboardingStep,
      onboardingStatus: p.onboardingStatus,
      rejectionReason: p.rejectionReason,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      createdAt: new Date(p.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(p.updatedAt || Date.now()).toISOString(),
    };

    if (p.userId && typeof p.userId === 'object' && ('name' in p.userId || 'email' in p.userId || '_id' in p.userId)) {
      result.userId = {
        _id: p.userId._id?.toString() || p.userId.toString(),
        name: p.userId.name || "",
        email: p.userId.email || "",
        phone: p.userId.phone || "",
        profilePhoto: p.userId.profilePhoto,
      };
    } else {
      result.userId = p.userId?.toString();
    }

    if (p.serviceId && typeof p.serviceId === 'object' && ('name' in p.serviceId || 'description' in p.serviceId || '_id' in p.serviceId)) {
      result.serviceId = {
        _id: p.serviceId._id?.toString() || p.serviceId.toString(),
        name: p.serviceId.name,
        description: p.serviceId.description,
      };
    } else {
      result.serviceId = p.serviceId?.toString();
    }

    return result;
  }

  static toPublicResponse(profile: IProviderProfile | any): PublicProviderProfileDTO | any {
    if (!profile) return null;

    const p = typeof profile.toObject === 'function' ? profile.toObject() : profile;
    
    const result: any = {
      _id: p._id.toString(),
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
      result.userId = {
        _id: p.userId._id?.toString() || p.userId.toString(),
        name: p.userId.name || "",
        email: p.userId.email || "",
        phone: p.userId.phone || "",
        profilePhoto: p.userId.profilePhoto,
      };
    } else {
      result.userId = p.userId?.toString();
    }

    if (p.serviceId && typeof p.serviceId === 'object' && ('name' in p.serviceId || 'description' in p.serviceId || '_id' in p.serviceId)) {
      result.serviceId = {
        _id: p.serviceId._id?.toString() || p.serviceId.toString(),
        name: p.serviceId.name,
        description: p.serviceId.description,
      };
    } else {
      result.serviceId = p.serviceId?.toString();
    }

    return result;
  }

  static toArrayResponse(profiles: any[], isPublic: boolean = false): (ProviderProfileResponseDTO | PublicProviderProfileDTO)[] {
    return profiles.map(p => isPublic ? this.toPublicResponse(p)! : this.toResponse(p)!);
  }
}
