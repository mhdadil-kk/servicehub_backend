import mongoose from "mongoose";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IProviderAvailabilityRepository } from "../interfaces/repositories/IProviderAvailabilityRepository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IProviderDocument, IProviderProfile, IProviderAvailability } from "../types/providerProfile.types";
import { BadRequestError, NotFoundError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { IProviderService } from "../interfaces/services/IProviderService";

export class ProviderService implements IProviderService {
    private _providerProfileRepository: IProviderProfileRepository;
  private _providerAvailabilityRepository: IProviderAvailabilityRepository;
  private _userRepository: IUserRepository;
  constructor(
    providerProfileRepository: IProviderProfileRepository,
    providerAvailabilityRepository: IProviderAvailabilityRepository,
    userRepository: IUserRepository
  ) {
    this._providerProfileRepository = providerProfileRepository;
    this._providerAvailabilityRepository = providerAvailabilityRepository;
    this._userRepository = userRepository;
}

  async getProfile(userId: string) {
    return this._providerProfileRepository.findByUserIdWithDetails(userId);
  }

  async updateProfile(userId: string, data: { bio?: string; profilePhoto?: string; name?: string; phone?: string }) {
    const profile = await this._providerProfileRepository.findOrCreateByUserId(userId);

    const profileUpdate: Partial<IProviderProfile> = {
      onboardingStep: Math.max(profile.onboardingStep, 2),
    };
    if (data.bio) profileUpdate.bio = data.bio;
    if (data.profilePhoto) profileUpdate.profilePhoto = data.profilePhoto;

    const updated = await this._providerProfileRepository.updateById(
      profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id,
      profileUpdate
    );

    if (data.name || data.phone || data.profilePhoto) {
      await this._userRepository.updateById(userId, {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.profilePhoto && { profilePhoto: data.profilePhoto }),
      });
    }

    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async updateLocation(userId: string, data: { address?: string; serviceRadius?: number; latitude?: number; longitude?: number }) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const update: Partial<IProviderProfile> = {
      onboardingStep: Math.max(profile.onboardingStep, 3),
    };
    if (data.address) update.address = data.address;
    if (data.serviceRadius) update.serviceRadius = data.serviceRadius;
    if (data.latitude != null && data.longitude != null) {
      update.location = {
        type: "Point",
        coordinates: [data.longitude, data.latitude],
      };
    }

    const updated = await this._providerProfileRepository.updateById(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id, update);
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async updateServiceDetails(userId: string, { serviceId, hourlyRate }: { serviceId: string; hourlyRate: number }) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
                             
    return (await this._providerProfileRepository.updateById(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id, {
      serviceId: serviceId as unknown as mongoose.Types.ObjectId,
      hourlyRate,
      onboardingStep: Math.max(profile.onboardingStep, 4),
    }))!;
  }

  async uploadVerificationDocs(userId: string, documents: IProviderDocument[]) {
    if (!documents.length) throw new BadRequestError(ERROR_MESSAGES.NO_DOCUMENTS_UPLOADED);

    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    return (await this._providerProfileRepository.updateById(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id, {
      documents,
      onboardingStep: Math.max(profile.onboardingStep, 5),
      onboardingStatus: "in_review",
    }))!;
  }

  async updateBankDetails(userId: string, bankDetails: NonNullable<IProviderProfile["bankDetails"]>) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const updated = await this._providerProfileRepository.updateById(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id, {
      bankDetails,
      onboardingStep: 5,
      onboardingStatus: "in_review",
    });

    await this._userRepository.updateById(userId, { status: "pending" }); 
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async resetForReapply(userId: string) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    if (profile.onboardingStatus !== "rejected") {
      throw new BadRequestError(ERROR_MESSAGES.ONLY_REJECTED_CAN_REAPPLY);
    }

    const updated = await this._providerProfileRepository.updateById(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id, {
      onboardingStatus: "pending",
      onboardingStep: 1,
      rejectionReason: "",
    });

    await this._userRepository.updateById(userId, { status: "pending" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async getAvailability(userId: string) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);

    return this._providerAvailabilityRepository.findOrCreateByProviderId(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id);
  }

  async updateAvailability(userId: string, data: Partial<IProviderAvailability>) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);

    return this._providerAvailabilityRepository.upsertByProviderId(profile._id ? profile._id.toString() : (profile as unknown as { id: string }).id, data);
  }
}