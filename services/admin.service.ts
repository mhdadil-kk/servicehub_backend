import { IUserRepository } from "../repositories/auth.repository";
import { IUser } from "../types/user.types";
import { FilterQuery } from "mongoose";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";

export interface IAdminService {
  getAllUsers(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ users: IUser[], total: number }>;
  getProviders(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ providers: IUser[], total: number }>;
  updateUserStatus(id: string, status: string): Promise<IUser>;
  unblockUser(id: string): Promise<IUser>;
  deleteUser(id: string): Promise<void>;
}

export class AdminService implements IAdminService {
  private _userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository;
  }

  async getAllUsers(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ users: IUser[], total: number }> {
    const filter: FilterQuery<IUser> = { role: "user" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (status === "active") filter.isDeleted = { $ne: true };
    if (status === "blocked") filter.isDeleted = true;

    let sortQuery: Record<string, number> = { created_at: -1 };
    if (sort === "oldest") sortQuery = { created_at: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this._userRepository.findAll(filter, true, sortQuery, limit, skip),
      this._userRepository.count(filter, true)
    ]);

    return { users, total };
  }

  async getProviders(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ providers: IUser[], total: number }> {
    const filter: FilterQuery<IUser> = { role: "provider" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (status === "active") filter.isDeleted = { $ne: true };
    if (status === "blocked") filter.isDeleted = true;
    if (status === "pending") filter.status = "pending";
    if (status === "approved") filter.status = "approved";
    if (status === "rejected") filter.status = "rejected";

    let sortQuery: Record<string, number> = { created_at: -1 };
    if (sort === "oldest") sortQuery = { created_at: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const skip = (page - 1) * limit;
    const [providers, total] = await Promise.all([
      this._userRepository.findAll(filter, true, sortQuery, limit, skip),
      this._userRepository.count(filter, true)
    ]);

    return { providers, total };
  }

  async updateUserStatus(id: string, status: string): Promise<IUser> {
    if (!["approved", "rejected", "pending"].includes(status)) {
      throw new BadRequestError("Invalid status value");
    }

    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this._userRepository.update(id, { status });
    if (!updatedUser) throw new NotFoundError("User could not be updated");

    return updatedUser;
  }

  async unblockUser(id: string): Promise<IUser> {
    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this._userRepository.update(id, { isDeleted: false });
    if (!updatedUser) throw new NotFoundError("User could not be updated");

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    await this.userRepository.softDelete(id);
  }


}
