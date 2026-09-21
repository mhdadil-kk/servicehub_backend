import { UserResponseDTO } from "../../dtos/auth.dto";
import { IService } from "../../types/service.types";
import { ServiceResponseDTO } from "../../dtos/service.dto";
import { ProviderProfileResponseDTO } from "../../dtos/provider.dto";
import { BookingResponseDTO, DetailedBookingResponseDTO } from "../../dtos/booking.dto";
import { ReportResponseDTO } from "../../dtos/report.dto";
import { RevenueReportDTO } from "../../dtos/dashboard.dto";
import { ReportAction } from "../../types/report.types";

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
  getAllUsers(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ users: UserResponseDTO[]; total: number }>;
  getProviders(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ providers: UserResponseDTO[]; total: number }>;
  updateUserStatus(id: string, status: string): Promise<UserResponseDTO>;
  unblockUser(id: string): Promise<UserResponseDTO>;
  deleteUser(id: string): Promise<void>;
  addService(data: Partial<IService>): Promise<ServiceResponseDTO>;
  getAllServices(): Promise<ServiceResponseDTO[]>;
  deleteService(id: string): Promise<void>;
  getPendingProviders(): Promise<ProviderProfileResponseDTO[]>;
  getProviderDetail(userId: string): Promise<ProviderProfileResponseDTO | null>;
  verifyProvider(userId: string, status: "approved" | "rejected", remarks?: string): Promise<void>;
  getDashboardStats(timeRange?: string): Promise<AdminDashboardStats>;
  getAllBookings(search?: string, status?: string, sort?: string, page?: number, limit?: number): Promise<{ bookings: (BookingResponseDTO | DetailedBookingResponseDTO)[]; total: number }>;
  getBookingById(id: string): Promise<DetailedBookingResponseDTO | null>;
  getRevenueReport(timeRange?: string): Promise<RevenueReportDTO>;
  getAllReports(status?: string, page?: number, limit?: number): Promise<{ reports: ReportResponseDTO[]; total: number }>;
  resolveReport(reportId: string, action: ReportAction, resolutionNotes?: string): Promise<ReportResponseDTO>;
}
