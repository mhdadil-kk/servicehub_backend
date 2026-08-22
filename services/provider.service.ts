import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IProviderAvailabilityRepository } from "../interfaces/repositories/IProviderAvailabilityRepository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IProviderDocument, IProviderAvailability, IProviderProfile } from "../types/providerProfile.types";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { IProviderService } from "../interfaces/services/IProviderService";
import { ProviderProfileResponseDTO, ProviderAvailabilityResponseDTO } from "../dtos/provider.dto";
import { ProviderProfileMapper } from "../mappers/providerProfile.mapper";
import { ProviderAvailabilityMapper } from "../mappers/providerAvailability.mapper";
import mongoose from "mongoose";

export class ProviderService implements IProviderService {
  constructor(
    private _providerProfileRepository: IProviderProfileRepository,
    private _providerAvailabilityRepository: IProviderAvailabilityRepository,
    private _userRepository: IUserRepository
  ) {}

  async getProfile(userId: string): Promise<ProviderProfileResponseDTO | null> {
    let profile = await this._providerProfileRepository.findByUserId(userId);
    
    if (!profile) {
      profile = await this._providerProfileRepository.create({
        userId: new mongoose.Types.ObjectId(userId) as unknown as string,
        onboardingStatus: "pending",
        onboardingStep: 1,
      });
    }

    return ProviderProfileMapper.toResponse(profile);
  }

  async updateProfile(userId: string, data: { bio?: string; name?: string; phone?: string; profilePhoto?: string }): Promise<ProviderProfileResponseDTO> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    await this._userRepository.updateById(userId, {
      name: data.name,
      phone: data.phone,
    });

    const updated = await this._providerProfileRepository.updateById(
      profile._id?.toString() || "",
      {
        bio: data.bio,
        profilePhoto: data.profilePhoto,
        onboardingStep: Math.max(profile.onboardingStep, 2),
      }
    );
    return ProviderProfileMapper.toResponse(updated)!;
  }

  async updateLocation(userId: string, data: { address?: string; latitude?: number; longitude?: number; serviceRadius?: number }): Promise<ProviderProfileResponseDTO> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const updateData: Partial<IProviderProfile> = {
      address: data.address,
      serviceRadius: data.serviceRadius,
      onboardingStep: Math.max(profile.onboardingStep, 3),
    };
    if (data.latitude !== undefined && data.longitude !== undefined) {
      updateData.location = { type: "Point", coordinates: [data.longitude, data.latitude] };
    }

    const updated = await this._providerProfileRepository.updateById(
      profile._id?.toString() || "", 
      updateData
    );
    return ProviderProfileMapper.toResponse(updated)!;
  }

  async updateServiceDetails(userId: string, data: { serviceId: string; hourlyRate: number }): Promise<ProviderProfileResponseDTO> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const updated = await this._providerProfileRepository.updateById(
      profile._id?.toString() || "", 
      {
        serviceId: new mongoose.Types.ObjectId(data.serviceId),
        hourlyRate: data.hourlyRate,
        onboardingStep: Math.max(profile.onboardingStep, 4),
      }
    );
    return ProviderProfileMapper.toResponse(updated)!;
  }

  async uploadVerificationDocs(userId: string, documents: IProviderDocument[]): Promise<ProviderProfileResponseDTO> {
    if (!documents.length) throw new BadRequestError(ERROR_MESSAGES.NO_DOCUMENTS_UPLOADED);

    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const updated = await this._providerProfileRepository.updateById(
      profile._id?.toString() || "", 
      {
        documents,
        onboardingStep: Math.max(profile.onboardingStep, 5),
        onboardingStatus: "in_review",
      }
    );
    return ProviderProfileMapper.toResponse(updated)!;
  }

  async updateBankDetails(userId: string, bankDetails: { accountHolderName: string; bankName: string; accountNumber: string; routingNumber?: string; ifscCode?: string }): Promise<ProviderProfileResponseDTO> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    const updated = await this._providerProfileRepository.updateById(
      profile._id?.toString() || "", 
      {
        bankDetails,
        onboardingStep: 5,
        onboardingStatus: "in_review",
      }
    );

    await this._userRepository.updateById(userId, { status: "pending" }); 
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return ProviderProfileMapper.toResponse(updated)!;
  }

  async resetForReapply(userId: string): Promise<ProviderProfileResponseDTO> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);

    if (profile.onboardingStatus !== "rejected") {
      throw new BadRequestError(ERROR_MESSAGES.ONLY_REJECTED_CAN_REAPPLY);
    }

    const updated = await this._providerProfileRepository.updateById(
      profile._id?.toString() || "", 
      {
        onboardingStatus: "pending",
        onboardingStep: 1,
        rejectionReason: "",
      }
    );

    await this._userRepository.updateById(userId, { status: "pending" });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    return ProviderProfileMapper.toResponse(updated)!;
  }

  async getAvailability(userId: string): Promise<ProviderAvailabilityResponseDTO | null> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);

    const avail = await this._providerAvailabilityRepository.findOrCreateByProviderId(
      profile._id?.toString() || ""
    );
    return ProviderAvailabilityMapper.toResponse(avail);
  }

  async updateAvailability(userId: string, data: Partial<IProviderAvailability>): Promise<ProviderAvailabilityResponseDTO> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(ERROR_MESSAGES.PROVIDER_PROFILE_NOT_FOUND);

    const avail = await this._providerAvailabilityRepository.upsertByProviderId(
      profile._id?.toString() || "", 
      data
    );
    return ProviderAvailabilityMapper.toResponse(avail)!;
  }
}