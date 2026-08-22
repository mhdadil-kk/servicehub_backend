import { IProviderAvailability, IProviderDocument } from "../../types/providerProfile.types";
import { ProviderProfileResponseDTO, ProviderAvailabilityResponseDTO } from "../../dtos/provider.dto";

export interface IProviderService {
  getProfile(userId: string): Promise<ProviderProfileResponseDTO | null>;
  updateProfile(userId: string, data: {
    bio?: string;
    name?: string;
    phone?: string;
    profilePhoto?: string;
  }): Promise<ProviderProfileResponseDTO>;
  updateLocation(userId: string, data: {
    address?: string;
    latitude?: number;
    longitude?: number;
    serviceRadius?: number;
  }): Promise<ProviderProfileResponseDTO>;
  updateServiceDetails(userId: string, data: {
    serviceId: string;
    hourlyRate: number;
  }): Promise<ProviderProfileResponseDTO>;
  uploadVerificationDocs(userId: string, documents: IProviderDocument[]): Promise<ProviderProfileResponseDTO>;
  updateBankDetails(userId: string, data: {
    accountHolderName?: string;
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    ifscCode?: string;
  }): Promise<ProviderProfileResponseDTO>;
  resetForReapply(userId: string): Promise<ProviderProfileResponseDTO>;
  getAvailability(userId: string): Promise<ProviderAvailabilityResponseDTO | null>;
  updateAvailability(userId: string, data: Partial<IProviderAvailability>): Promise<ProviderAvailabilityResponseDTO>;
}
