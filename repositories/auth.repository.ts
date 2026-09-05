import mongoose from "mongoose";
import { UserModel } from "../models/user.model";
import { IUser } from "../types/user.types";
import { BaseRepository } from "./base.repository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";


export class AuthRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.model
      .findOne({ email, isDeleted: { $ne: true } } as mongoose.FilterQuery<IUser>)
      .select("+password")
      .exec();
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return this.model
      .findOne({ _id: id, isDeleted: { $ne: true } } as mongoose.FilterQuery<IUser>)
      .select("+password")
      .exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model
      .findOne({ email, isDeleted: { $ne: true } } as mongoose.FilterQuery<IUser>)
      .exec();
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return this.update(id, data);
  }

  async findIdsByRoleAndName(role: string, name: string): Promise<string[]> {
    const users = await this.model
      .find({ role, name: { $regex: name, $options: "i" } } as mongoose.FilterQuery<IUser>)
      .select("_id")
      .exec();
    return users.map((u) => (u._id as { toString(): string }).toString());
  }

  async countByRole(role: string, dateFilter: mongoose.FilterQuery<IUser> = {}): Promise<number> {  
    return this.model
      .countDocuments({ role, isDeleted: { $ne: true }, ...dateFilter } as mongoose.FilterQuery<IUser>)
      .exec();
  }

  async getUserGrowth(
    dateFilter: mongoose.FilterQuery<IUser> = {},
    timeRange?: string
  ): Promise<{ _id: Record<string, number | string>; count: number }[]> {
    const groupId: Record<string, unknown> = {
      year: { $year: "$createdAt" },
      role: "$role",
    };
    let sortObj: Record<string, 1 | -1> = { "_id.year": 1 };

    if (timeRange === "year" || timeRange === "month") {
      groupId["month"] = { $month: "$createdAt" };
      sortObj = { "_id.year": 1, "_id.month": 1 };
    }
    if (timeRange === "month") {
      groupId["day"] = { $dayOfMonth: "$createdAt" };
      sortObj = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
    }

    return this.model.aggregate([
      {
        $match: {
          role: { $in: ["user", "provider"] },
          isDeleted: { $ne: true },
          ...dateFilter,
        },
      },
      { $group: { _id: groupId, count: { $sum: 1 } } },
      { $sort: sortObj },
    ]);
  }
}
