import mongoose from "mongoose";
import ProviderAvailabilityModel from "../models/providerAvailability.model";
import { IProviderAvailability } from "../types/providerProfile.types";
import { BaseRepository } from "./base.repository";

import { IProviderAvailabilityRepository } from "../interfaces/repositories/IProviderAvailabilityRepository";

export class ProviderAvailabilityRepository
  extends BaseRepository<IProviderAvailability>
  implements IProviderAvailabilityRepository
{
  constructor() {
    super(ProviderAvailabilityModel);
  }

  async findByProviderId(providerId: string): Promise<IProviderAvailability | null> {
    return this.findOne({ providerId } as mongoose.FilterQuery<IProviderAvailability>);
  }

  async findOrCreateByProviderId(providerId: string): Promise<IProviderAvailability> {
    let availability = await this.findByProviderId(providerId);
    if (!availability) {
      availability = await this.create({ providerId } as unknown as Partial<IProviderAvailability>);
    }
    return availability;
  }

  async upsertByProviderId(
    providerId: string,
    data: Partial<IProviderAvailability>
  ): Promise<IProviderAvailability> {
    const result = await this.model.findOneAndUpdate(
      { providerId } as mongoose.FilterQuery<IProviderAvailability>,
      { $set: data },
      { new: true, upsert: true }
    ).exec();
    return result!;
  }
}
