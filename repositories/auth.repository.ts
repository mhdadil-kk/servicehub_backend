import { UserModel, IUser } from "../models/user.model";
import { BaseRepository } from "../repositories/base.repository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";

export class AuthRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email }).exec();
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return this.update(id, data);
  }
}
