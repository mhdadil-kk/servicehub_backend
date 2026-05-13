import { IProviderService } from "../interfaces/services/IProviderService";
import { IProviderRepository } from "../interfaces/repositories/IProviderRepository";
import { IProviderProfile } from "../interfaces/models/IProviderProfile";
import { NotFoundError } from "../utils/error";
import { ProviderRepository } from "../repositories/provider.repository";
import User from "../models/user.model";
import ProviderProfile from "../models/providerProfile.model";

export class ProviderService implements IProviderService {
  private _providerRepository: IProviderRepository;

  constructor() {
    this._providerRepository = new ProviderRepository();
  }

  async updateProfile(userId: string, data: { bio?: string; serviceRadius?: number; profilePhoto?: string }): Promise<IProviderProfile> {
    let profile = await this._providerRepository.findOne({ userId });

    if (!profile) {
      profile = await this._providerRepository.create({ userId } as any);
    }

    const updateData: any = {};
    if (data.bio) updateData.bio = data.bio;
    if (data.serviceRadius) updateData.serviceRadius = data.serviceRadius;
    if (data.profilePhoto) updateData.profilePhoto = data.profilePhoto;
    updateData.onboardingStep = Math.max(profile!.onboardingStep, 2);

    return (await this._providerRepository.update(profile!._id as string, updateData)) as IProviderProfile;
  }

  async updateServiceDetails(userId: string, data: { serviceId: string; hourlyRate: number }): Promise<IProviderProfile> {
    const profile = await this._providerRepository.findOne({ userId });
    if (!profile) throw new NotFoundError("Profile not found");

    return (await this._providerRepository.update(profile._id as string, {
      serviceId: data.serviceId,
      hourlyRate: data.hourlyRate,
      onboardingStep: Math.max(profile.onboardingStep, 3)
    })) as IProviderProfile;
  }

  async uploadDocuments(userId: string, documents: { docType: "identity" | "license"; url: string }[]): Promise<IProviderProfile> {
    const profile = await this._providerRepository.findOne({ userId });
    if (!profile) throw new NotFoundError("Profile not found");

    return (await this._providerRepository.update(profile._id as string, {
      documents,
      onboardingStep: Math.max(profile.onboardingStep, 4),
      onboardingStatus: "in_review"
    })) as IProviderProfile;
  }

  async updateBankDetails(userId: string, data: { accountHolderName: string; bankName: string; accountNumber: string; routingNumber: string }): Promise<IProviderProfile> {
    const profile = await this._providerRepository.findOne({ userId });
    if (!profile) throw new NotFoundError("Profile not found");

    const updatedProfile = await this._providerRepository.update(profile._id as string, {
      bankDetails: data,
      onboardingStep: 4,
      onboardingStatus: "in_review"
    });

    await User.findByIdAndUpdate(userId, { status: "in_review" });

    return updatedProfile as IProviderProfile;
  }

  async getProfile(userId: string): Promise<IProviderProfile | null> {
    // Repository doesn't handle complex populate yet, so we use model directly or update repo
    return await ProviderProfile.findOne({ userId }).populate("serviceId");
  }
}
