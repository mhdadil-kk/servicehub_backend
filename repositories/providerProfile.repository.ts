import providerProfileModel from "../models/providerProfile.model";
import { IProviderProfile } from "../types/providerProfile.types";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";

export class ProviderProfileRepository
  extends BaseRepository<IProviderProfile>
  implements IProviderProfileRepository {
  constructor() {
    super(providerProfileModel);
  }

  async findByUserId(userId: string): Promise<IProviderProfile | null> {
    return this.findOne({ userId } as FilterQuery<IProviderProfile>);
  }

  async updateRating(
    providerProfileId: string,
    averageRating: number,
    totalReviews: number
  ): Promise<IProviderProfile | null> {
    return this.update(providerProfileId, {
      averageRating,
      totalReviews,
    });
  }

  async incrementRating(providerProfileId: string, rating: number): Promise<void> {
    await this.model.findByIdAndUpdate(
      providerProfileId,
      [
        {
          $set: {
            totalReviews: { $add: [{ $ifNull: ["$totalReviews", 0] }, 1] },
            averageRating: {
              $round: [
                {
                  $divide: [
                    {
                      $add: [
                        {
                          $multiply: [
                            { $ifNull: ["$averageRating", 0] },
                            { $ifNull: ["$totalReviews", 0] },
                          ],
                        },
                        rating,
                      ],
                    },
                    { $add: [{ $ifNull: ["$totalReviews", 0] }, 1] },
                  ],
                },
                1,
              ],
            },
          },
        },
      ]
    ).exec();
  }

  async findByUserIdWithDetails(userId: string): Promise<IProviderProfile | null> {
    return this.model
      .findOne({ userId } as FilterQuery<IProviderProfile>)
      .populate("userId", "name email phone role status profilePhoto")
      .populate("serviceId", "name description")
      .exec();
  }

  async findOrCreateByUserId(userId: string): Promise<IProviderProfile> {
    let profile = await this.findByUserId(userId);
    if (!profile) {
      profile = await this.create({ userId } as Partial<IProviderProfile>);
    }
    return profile;
  }
  
  async updateByUserId(userId: string, data: Partial<IProviderProfile>): Promise<IProviderProfile | null> {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;
    return this.update(profile._id.toString(), data);
  }

  async updateById(id: string, data: Partial<IProviderProfile>): Promise<IProviderProfile | null> {
    return this.update(id, data);
  }
}
