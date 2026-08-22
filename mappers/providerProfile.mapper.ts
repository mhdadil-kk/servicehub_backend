import { IProviderProfile } from "../types/providerProfile.types";
import { ProviderProfileResponseDTO, PublicProviderProfileDTO } from "../dtos/provider.dto";

export class ProviderProfileMapper {
  static toResponse(
    profile: (IProviderProfile & { toObject?: () => IProviderProfile }) | null
  ): ProviderProfileResponseDTO | null {
    if (!profile) return null;

    const p = typeof profile.toObject === "function" ? profile.toObject() : profile;

    let userIdVal: ProviderProfileResponseDTO["userId"] = p.userId ? p.userId.toString() : "";
    if (p.userId && typeof p.userId === "object" && "_id" in p.userId) {
      const u = p.userId;
      userIdVal = {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        profilePhoto: u.profilePhoto,
      };
    }

    let serviceIdVal: ProviderProfileResponseDTO["serviceId"] = p.serviceId ? p.serviceId.toString() : undefined;
    if (p.serviceId && typeof p.serviceId === "object" && "_id" in p.serviceId) {
      const s = p.serviceId;
      serviceIdVal = {
        _id: s._id.toString(),
        name: s.name,
        description: s.description,
      };
    }

    return {
      _id: p._id?.toString() || p.id || "",
      userId: userIdVal,
      serviceId: serviceIdVal,
      bio: p.bio,
      profilePhoto: p.profilePhoto,
      hourlyRate: p.hourlyRate,
      serviceRadius: p.serviceRadius,
      address: p.address,
      location: p.location,
      documents: p.documents || [],
      onboardingStep: p.onboardingStep,
      onboardingStatus: p.onboardingStatus,
      rejectionReason: p.rejectionReason,
      bankDetails: p.bankDetails,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      createdAt: new Date(p.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(p.updatedAt || Date.now()).toISOString(),
    };
  }

  static toPublicResponse(
    profile: (IProviderProfile & { toObject?: () => IProviderProfile }) | null
  ): PublicProviderProfileDTO | null {
    if (!profile) return null;

    const p = typeof profile.toObject === "function" ? profile.toObject() : profile;

    let userIdVal: PublicProviderProfileDTO["userId"] = p.userId ? p.userId.toString() : "";
    if (p.userId && typeof p.userId === "object" && "_id" in p.userId) {
      const u = p.userId;
      userIdVal = {
        _id: u._id.toString(),
        name: u.name,
        profilePhoto: u.profilePhoto,
      };
    }

    let serviceIdVal: PublicProviderProfileDTO["serviceId"] = p.serviceId ? p.serviceId.toString() : undefined;
    if (p.serviceId && typeof p.serviceId === "object" && "_id" in p.serviceId) {
      const s = p.serviceId;
      serviceIdVal = {
        _id: s._id.toString(),
        name: s.name,
      };
    }

    return {
      _id: p._id?.toString() || p.id || "",
      userId: userIdVal,
      serviceId: serviceIdVal,
      bio: p.bio,
      profilePhoto: p.profilePhoto,
      hourlyRate: p.hourlyRate,
      serviceRadius: p.serviceRadius,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      location: p.location,
    };
  }

  static toArrayResponse(
    profiles: (IProviderProfile & { toObject?: () => IProviderProfile })[],
    isPublic = false
  ): (ProviderProfileResponseDTO | PublicProviderProfileDTO)[] {
    return profiles.map((p) => (isPublic ? this.toPublicResponse(p)! : this.toResponse(p)!));
  }
}
