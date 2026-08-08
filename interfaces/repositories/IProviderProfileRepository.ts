import { IProviderProfile } from "../../types/providerProfile.types";
import mongoose from "mongoose";

export interface FindApprovedProvidersOptions {
  serviceId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 1 | -1;
  userIds?: string[];
  serviceIds?: string[];
}

export interface IProviderProfileRepository {
  findById(id: string): Promise<IProviderProfile | null>;
  findByUserId(userId: string): Promise<IProviderProfile | null>;
  findByUserIdWithDetails(userId: string): Promise<IProviderProfile | null>;
  findOrCreateByUserId(userId: string): Promise<IProviderProfile>;
  updateByUserId(userId: string, data: Partial<IProviderProfile>): Promise<IProviderProfile | null>;
  updateById(id: string, data: Partial<IProviderProfile>): Promise<IProviderProfile | null>;
  incrementRating(providerProfileId: string, rating: number): Promise<void>;
  findApprovedProviders(options: FindApprovedProvidersOptions): Promise<{ providers: IProviderProfile[]; total: number }>;
  findPendingProviders(dateFilter?: mongoose.FilterQuery<IProviderProfile>): Promise<IProviderProfile[]>;
  countByStatus(status: string, dateFilter?: mongoose.FilterQuery<IProviderProfile>): Promise<number>;
  findIdsByUserIds(userIds: string[]): Promise<string[]>;
}
