import { IUserRepository } from "../auth/auth.repository";
import { IUser } from "./user.types";
import { NotFoundError, BadRequestError } from "../../utils/error";
import { ERROR_MESSAGES } from "../../constants/messages";

export interface IAdminService {
  getAllUsers(): Promise<IUser[]>;
  getProviders(): Promise<IUser[]>;
  updateUserStatus(id: string, status: string): Promise<IUser>;
  unblockUser(id: string): Promise<IUser>;
  deleteUser(id: string): Promise<void>;
}

export class AdminService implements IAdminService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async getAllUsers(): Promise<IUser[]> {
    const res = await this.userRepository.findAll({ role: "user" }, true);
    return res;
  }

  async getProviders(): Promise<IUser[]> {
    const res = await this.userRepository.findAll({ role: "provider" }, true);
    return res;
  }

  async updateUserStatus(id: string, status: string): Promise<IUser> {
    if (!["approved", "rejected", "pending"].includes(status)) {
      throw new BadRequestError("Invalid status value");
    }

    const user = await this.userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this.userRepository.update(id, { status });
    if (!updatedUser) throw new NotFoundError("User could not be updated");
    
    return updatedUser;
  }

  async unblockUser(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this.userRepository.update(id, { isDeleted: false });
    if (!updatedUser) throw new NotFoundError("User could not be updated");
    
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    await this.userRepository.softDelete(id);
  }
}
