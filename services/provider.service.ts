import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IProviderAvailabilityRepository } from "../interfaces/repositories/IProviderAvailabilityRepository";
import { IUserRepository } from "../repositories/auth.repository";
import { IProviderProfile } from "../types/providerProfile.types";
import { IProviderAvailability } from "../types/providerProfile.types";
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

  async updateProfile(userId, data) {
    const profile = await this._providerProfileRepository.findOrCreateByUserId(userId);

    const profileUpdate: Partial<IProviderProfile> = {
      onboardingStep: Math.max(profile.onboardingStep, 2),
    };
    if (data.bio) profileUpdate.bio = data.bio;
    if (data.profilePhoto) profileUpdate.profilePhoto = data.profilePhoto;

    const updated = await this._providerProfileRepository.updateById(
      profile._id.toString(),
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

  async updateLocation(userId, data) {
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

    const updated = await this._providerProfileRepository.updateById(profile._id.toString(), update);
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async updateServiceDetails(userId, { serviceId, hourlyRate }) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    return (await this._providerProfileRepository.updateById(profile._id.toString(), {
      serviceId,
      hourlyRate,
      onboardingStep: Math.max(profile.onboardingStep, 4),
    }))!;
  }

  async uploadVerificationDocs(userId, documents) {
    if (!documents.length) throw new BadRequestError(ERROR_MESSAGES.NO_DOCUMENTS_UPLOADED);

    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    return (await this._providerProfileRepository.updateById(profile._id.toString(), {
      documents,
      onboardingStep: Math.max(profile.onboardingStep, 5),
      onboardingStatus: "in_review",
    }))!;
  }

  async updateBankDetails(userId, bankDetails) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const updated = await this._providerProfileRepository.updateById(profile._id.toString(), {
      bankDetails,
      onboardingStep: 5,
      onboardingStatus: "in_review",
    });

    await this._userRepository.updateById(userId, { status: "in_review" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async resetForReapply(userId) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    if (profile.onboardingStatus !== "rejected") {
      throw new BadRequestError(ERROR_MESSAGES.ONLY_REJECTED_CAN_REAPPLY);
    }

    const updated = await this._providerProfileRepository.updateById(profile._id.toString(), {
      onboardingStatus: "pending",
      onboardingStep: 1,
      rejectionReason: "",
    });

    await this._userRepository.updateById(userId, { status: "pending" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return updated;
  }

  async getAvailability(userId) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);

    return this._providerAvailabilityRepository.findOrCreateByProviderId(profile._id.toString());
  }

  async updateAvailability(userId, data) {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);

    return this._providerAvailabilityRepository.upsertByProviderId(profile._id.toString(), data);
  }
}