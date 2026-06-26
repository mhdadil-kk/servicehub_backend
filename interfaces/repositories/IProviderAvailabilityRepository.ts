import { IProviderAvailability } from "../../types/providerProfile.types";

export interface IProviderAvailabilityRepository {
  findByProviderId(providerId: string): Promise<IProviderAvailability | null>;
  findOrCreateByProviderId(providerId: string): Promise<IProviderAvailability>;
  upsertByProviderId(providerId: string, data: Partial<IProviderAvailability>): Promise<IProviderAvailability>;
}
