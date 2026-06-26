import { IUser } from "../../models/user.model";
import { IRepository } from "./IRepository";

export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  updateById(id: string, data: Partial<IUser>): Promise<IUser | null>;
}
