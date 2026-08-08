import { AdminDashboardStats } from "../interfaces/services/IAdminService";
import { UserDashboardStats, ProviderDashboardStats } from "../types/dashboard.types";

export interface DashboardStatsDTO {
  totalUsers?: number;
  totalProviders?: number;
  totalBookings?: number;
  activeBookings?: number;
  upcomingBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  totalEarnings?: number;
  totalSpent?: number;
  totalRevenue?: number;
  revenue?: number;
  recentActivity?: unknown[];
  recentBookings?: unknown[];
  pendingProviders?: number;
  openReports?: number;
  userGrowth?: { label: string; users: number; providers: number }[];
  bookingTrends?: { label: string; val: number; color: string }[];
}

export interface RevenueReportDTO {
  totalRevenue: number;
  revenueByMonth: { month: string; year: number; revenue: number }[];
  totalBookings: number;
  completedBookings: number;
  platformFeeCollected: number;
}

type DashboardStatInput = AdminDashboardStats | UserDashboardStats | ProviderDashboardStats | null;

type RevenueReportInput = {
  totalRevenue: number;
  revenueByMonth: { month: string; year: number; revenue: number }[];
  totalBookings: number;
  completedBookings: number;
  platformFeeCollected: number;
} | null;

export class StatsMapper {
  static toDashboardResponse(stats: DashboardStatInput): DashboardStatsDTO | null {
    if (!stats) return null;
    const s = stats as unknown as Record<string, unknown>;
    return {
      totalUsers: s["totalUsers"] as number | undefined,
      totalProviders: s["totalProviders"] as number | undefined,
      totalBookings: s["totalBookings"] as number | undefined,
      activeBookings: s["activeBookings"] as number | undefined,
      upcomingBookings: s["upcomingBookings"] as number | undefined,
      completedBookings: s["completedBookings"] as number | undefined,
      cancelledBookings: s["cancelledBookings"] as number | undefined,
      totalEarnings: s["totalEarnings"] as number | undefined,
      totalSpent: s["totalSpent"] as number | undefined,
      totalRevenue: s["totalRevenue"] as number | undefined,
      revenue: s["revenue"] as number | undefined,
      recentActivity: s["recentActivity"] as unknown[] | undefined,
      recentBookings: s["recentBookings"] as unknown[] | undefined,
      pendingProviders: s["pendingProviders"] as number | undefined,
      openReports: s["openReports"] as number | undefined,
      userGrowth: s["userGrowth"] as { label: string; users: number; providers: number }[] | undefined,
      bookingTrends: s["bookingTrends"] as { label: string; val: number; color: string }[] | undefined,
    };
  }

  static toRevenueResponse(report: RevenueReportInput): RevenueReportDTO | null {
    if (!report) return null;
    return {
      totalRevenue: report.totalRevenue ?? 0,
      revenueByMonth: report.revenueByMonth ?? [],
      totalBookings: report.totalBookings ?? 0,
      completedBookings: report.completedBookings ?? 0,
      platformFeeCollected: report.platformFeeCollected ?? 0,
    };
  }
}
