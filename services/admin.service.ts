import { IUserRepository } from "../repositories/auth.repository";
import { IUser } from "../types/user.types";
import { FilterQuery } from "mongoose";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { ServiceRepository } from "../repositories/service.repository";
import { IService } from "../models/service.model";
import ProviderProfile from "../models/providerProfile.model";

export interface IAdminService {
  getAllUsers(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ users: IUser[], total: number }>;
  getProviders(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ providers: IUser[], total: number }>;
  updateUserStatus(id: string, status: string): Promise<IUser>;
  unblockUser(id: string): Promise<IUser>;
  deleteUser(id: string): Promise<void>;
  addService(data: Partial<IService>): Promise<IService>;
  getAllServices(): Promise<IService[]>;
  deleteService(id: string): Promise<void>;
  getPendingProviders(): Promise<any[]>;
  getProviderDetail(userId: string): Promise<any>;
  verifyProvider(userId: string, status: "approved" | "rejected", remarks?: string): Promise<void>;
}

export class AdminService implements IAdminService {
  private _userRepository: IUserRepository;
  private _serviceRepository: ServiceRepository;

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository;
    this._serviceRepository = new ServiceRepository();
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

    await this._userRepository.softDelete(id);
  }

  async addService(data: Partial<IService>): Promise<IService> {
    if (!data.name || !data.description) {
      throw new BadRequestError("Name and description are required");
    }

    // Check if service already exists (including soft-deleted ones)
    const existingService = await this._serviceRepository.findOne({ name: data.name }, true);
    
    if (existingService) {
      // If it exists but is marked as deleted, "revive" it
      if ((existingService as any).isDeleted) {
        return await this._serviceRepository.update(existingService._id, {
          description: data.description,
          isDeleted: false,
          isActive: true
        }) as IService;
      }
      // If it exists and is NOT deleted, throw the duplicate error
      throw new BadRequestError("A service with this name already exists");
    }

    try {
      return await this._serviceRepository.create(data as IService);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestError("A service with this name already exists");
      }
      throw new BadRequestError(error.message || "Failed to create service category");
    }
  }

  async getAllServices(): Promise<IService[]> {
    return await this._serviceRepository.findAll();
  }

  async deleteService(id: string): Promise<void> {
    const service = await this._serviceRepository.findById(id);
    if (!service) throw new NotFoundError("Service category not found");
    await this._serviceRepository.softDelete(id);
  }

  async getPendingProviders(): Promise<any[]> {
    return await ProviderProfile.find({ onboardingStatus: "in_review" })
      .populate("userId", "name email phone")
      .populate("serviceId", "name");
  }

  async getProviderDetail(userId: string): Promise<any> {
    const profile = await ProviderProfile.findOne({ userId })
      .populate("userId", "name email phone role status")
      .populate("serviceId", "name description");
    
    if (!profile) throw new NotFoundError("Provider profile not found");
    return profile;
  }

  async verifyProvider(userId: string, status: "approved" | "rejected", remarks?: string): Promise<void> {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new NotFoundError("Provider profile not found");

    profile.onboardingStatus = status;
    if (status === "rejected") {
      profile.rejectionReason = remarks || "No reason provided";
    } else {
      profile.rejectionReason = undefined;
    }
    
    await profile.save();

    // Also update the User status
    if (status === "approved") {
      await this._userRepository.update(userId, { is_verified: true, status: "active" });
    } else {
      // If rejected, set status back to pending so they can fix it and resubmit
      await this._userRepository.update(userId, { status: "pending" });
    }
  }
}
