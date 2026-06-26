import { IUser } from "../../types/user.types";
import { IService } from "../../models/service.model";

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
