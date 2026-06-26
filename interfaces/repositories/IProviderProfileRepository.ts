import { IProviderProfile } from "../../types/providerProfile.types";

export interface IProviderProfileRepository {
  findById(id: string): Promise<IProviderProfile | null>;
  findByUserId(userId: string): Promise<IProviderProfile | null>;
  findByUserIdWithDetails(userId: string): Promise<IProviderProfile | null>;
  findOrCreateByUserId(userId: string): Promise<IProviderProfile>;
  updateByUserId(userId: string, data: Partial<IProviderProfile>): Promise<IProviderProfile | null>;
  updateById(id: string, data: Partial<IProviderProfile>): Promise<IProviderProfile | null>;
  incrementRating(providerProfileId: string, rating: number): Promise<void>;
}
