import { IProviderProfile, IProviderAvailability, IProviderDocument } from "../../types/providerProfile.types";

export interface IProviderService {
  getProfile(userId: string): Promise<IProviderProfile | null>;
  updateProfile(userId: string, data: {
    bio?: string;
    name?: string;
    phone?: string;
    profilePhoto?: string;
  }): Promise<IProviderProfile>;
  updateLocation(userId: string, data: {
    address?: string;
    latitude?: number;
    longitude?: number;
    serviceRadius?: number;
  }): Promise<IProviderProfile>;
  updateServiceDetails(userId: string, data: {
    serviceId: string;
    hourlyRate: number;
  }): Promise<IProviderProfile>;
  uploadVerificationDocs(userId: string, documents: IProviderDocument[]): Promise<IProviderProfile>;
  updateBankDetails(userId: string, data: {
    accountHolderName?: string;
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    ifscCode?: string;
  }): Promise<IProviderProfile>;
  resetForReapply(userId: string): Promise<IProviderProfile>;
  getAvailability(userId: string): Promise<IProviderAvailability | null>;
  updateAvailability(userId: string, data: Partial<IProviderAvailability>): Promise<IProviderAvailability>;
}
