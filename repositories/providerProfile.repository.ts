import providerProfileModel from "../models/providerProfile.model";
import { IProviderProfile } from "../types/providerProfile.types";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose";
import { FindApprovedProvidersOptions, IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";

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

  async findApprovedProviders(options: FindApprovedProvidersOptions): Promise<{ providers: IProviderProfile[]; total: number }> {
    const { serviceId, latitude, longitude, radius, limit, skip, sortBy, sortOrder, userIds, serviceIds } = options;
    const query: FilterQuery<IProviderProfile> = { onboardingStatus: "approved" };

    if (serviceId) {
      query.serviceId = serviceId;
    }

    if (userIds || serviceIds) {
      query.$or = [];
      if (userIds && userIds.length > 0) {
        query.$or.push({ userId: { $in: userIds } });
      }
      if (serviceIds && serviceIds.length > 0) {
        query.$or.push({ serviceId: { $in: serviceIds } });
      }
      if (query.$or.length === 0) {
        return { providers: [], total: 0 };
      }
    }

    if (latitude && longitude && radius) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            radius / 6378.1
          ]
        }
      };
    }

    const sortParams: Record<string, 1 | -1> = {};
    if (sortBy === "hourlyRate") {
      sortParams.hourlyRate = sortOrder;
    } else {
      sortParams[sortBy] = sortOrder;
    }

    const [providers, total] = await Promise.all([
      this.model.find(query)
        .populate("userId", "name email phone role status profilePhoto")
        .populate("serviceId", "name description")
        .sort(sortParams)
        .limit(limit)
        .skip(skip)
        .exec(),
      this.model.countDocuments(query)
    ]);

    return { providers, total };
  }

  async findPendingProviders(dateFilter: any = {}): Promise<IProviderProfile[]> {
    return this.model.find({ onboardingStatus: "in_review", ...dateFilter })
      .populate("userId", "name email phone")
      .populate("serviceId", "name")
      .exec();
  }

  async countByStatus(status: string, dateFilter: any = {}): Promise<number> {
    return this.model.countDocuments({ onboardingStatus: status, ...dateFilter }).exec();
  }

  async findIdsByUserIds(userIds: string[]): Promise<string[]> {
    const profiles = await this.model.find({ userId: { $in: userIds } }).select("_id").exec();
    return profiles.map((p: any) => p._id.toString());
  }
}
