import { IUser } from "../../types/user.types";
import { IService } from "../../types/service.types";
import { IProviderProfile } from "../../types/providerProfile.types";
import { IBooking } from "../../types/booking.types";

export interface AdminDashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  pendingProviders: number;
  openReports: number;
  userGrowth: { label: string; users: number; providers: number }[];
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
  getPendingProviders(): Promise<IProviderProfile[]>;
  getProviderDetail(userId: string): Promise<IProviderProfile | null>;
  verifyProvider(userId: string, status: "approved" | "rejected", remarks?: string): Promise<void>;
  getDashboardStats(timeRange?: string): Promise<AdminDashboardStats>;
  getAllBookings(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ bookings: IBooking[], total: number }>;
  getBookingById(id: string): Promise<IBooking | null>;
  getRevenueReport(timeRange?: string): Promise<{
    totalRevenue: number;
    revenueByMonth: { month: string; year: number; revenue: number }[];
    totalBookings: number;
    completedBookings: number;
    platformFeeCollected: number;
  }>;
}
