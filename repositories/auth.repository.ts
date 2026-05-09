import { UserModel, IUser } from "../models/user.model";
import { BaseRepository } from "../repositories/base.repository";
import { IRepository } from "./IRepository";

export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

export class AuthRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email }).exec();
  }

 
}
