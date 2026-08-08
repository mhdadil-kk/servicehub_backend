import { IUser } from "../../types/user.types";
import { IRepository } from "./IRepository";
import mongoose from "mongoose";


export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  updateById(id: string, data: Partial<IUser>): Promise<IUser | null>;
  findIdsByRoleAndName(role: string, name: string): Promise<string[]>;
  countByRole(role: string, dateFilter?: mongoose.FilterQuery<IUser>): Promise<number>;
  getUserGrowth(
    dateFilter?: mongoose.FilterQuery<IUser>,
    timeRange?: string
  ): Promise<{ _id: Record<string, number | string>; count: number }[]>;
}
