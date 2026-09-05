import mongoose from "mongoose";
import ProviderAvailabilityModel from "../models/providerAvailability.model";
import { IDateOverride, IProviderAvailability } from "../types/providerProfile.types";
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
    const pId = mongoose.Types.ObjectId.isValid(providerId)
      ? new mongoose.Types.ObjectId(providerId)
      : providerId;
    return this.findOne({ providerId: pId } as mongoose.FilterQuery<IProviderAvailability>);
  }

  async findOrCreateByProviderId(providerId: string): Promise<IProviderAvailability> {
    let availability = await this.findByProviderId(providerId);
    if (!availability) {
      const pId = mongoose.Types.ObjectId.isValid(providerId)
        ? new mongoose.Types.ObjectId(providerId)
        : providerId;
      availability = await this.create({ providerId: pId } as unknown as Partial<IProviderAvailability>);
    }
    return availability;
  }

  async upsertByProviderId(
    providerId: string,
    data: Partial<IProviderAvailability>
  ): Promise<IProviderAvailability> {
    const pId = mongoose.Types.ObjectId.isValid(providerId)
      ? new mongoose.Types.ObjectId(providerId)
      : providerId;

    const updatePayload: Partial<IProviderAvailability> = { ...data };

    if (Array.isArray(updatePayload.overrides)) {
      updatePayload.overrides = updatePayload.overrides.filter(
        (o: IDateOverride) => o && typeof o.date === "string" && o.date.trim() !== ""
      );
    }

    const result = await this.model.findOneAndUpdate(
      { providerId: pId },
      {
        $set: updatePayload,
        $setOnInsert: { providerId: pId }
      },
      { new: true, upsert: true }
    ).exec();

    return result!;
  }
}