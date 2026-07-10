import { IUser } from "../../types/user.types";
import { IService } from "../../models/service.model";

export interface AdminDashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  pendingProviders: number;
  openReports: number;
  userGrowth: { month: string; value: number }[];
  bookingTrends: { label: string; val: number; color?: string }[];
}

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
  getDashboardStats(timeRange?: string): Promise<AdminDashboardStats>;
  getAllBookings(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ bookings: any[], total: number }>;
  getBookingById(id: string): Promise<any>;
}
