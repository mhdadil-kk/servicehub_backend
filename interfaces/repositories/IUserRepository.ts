import { IUser } from "../../models/user.model";
import { IRepository } from "./IRepository";

export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  updateById(id: string, data: Partial<IUser>): Promise<IUser | null>;
  findIdsByRoleAndName(role: string, name: string): Promise<string[]>;
  countByRole(role: string, dateFilter?: any): Promise<number>;
  getUserGrowth(dateFilter?: any, timeRange?: string): Promise<any[]>;
}
