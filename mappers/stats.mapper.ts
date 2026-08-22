import { DashboardStatsDTO, RevenueReportDTO } from "../dtos/dashboard.dto";

export class StatsMapper {
  static toDashboardResponse(stats: Record<string, unknown> | null): DashboardStatsDTO | null {
    if (!stats) return null;
    return {
      totalUsers: stats["totalUsers"] as number | undefined,
      totalProviders: stats["totalProviders"] as number | undefined,
      totalBookings: stats["totalBookings"] as number | undefined,
      activeBookings: stats["activeBookings"] as number | undefined,
      upcomingBookings: stats["upcomingBookings"] as number | undefined,
      completedBookings: stats["completedBookings"] as number | undefined,
      cancelledBookings: stats["cancelledBookings"] as number | undefined,
      totalEarnings: stats["totalEarnings"] as number | undefined,
      totalSpent: stats["totalSpent"] as number | undefined,
      totalRevenue: stats["totalRevenue"] as number | undefined,
      revenue: stats["revenue"] as number | undefined,
      recentActivity: stats["recentActivity"] as unknown[] | undefined,
      recentBookings: stats["recentBookings"] as unknown[] | undefined,
      pendingProviders: stats["pendingProviders"] as number | undefined,
      openReports: stats["openReports"] as number | undefined,
      userGrowth: stats["userGrowth"] as { label: string; users: number; providers: number }[] | undefined,
      bookingTrends: stats["bookingTrends"] as { label: string; val: number; color: string }[] | undefined,
    };
  }

  static toRevenueResponse(report: {
    totalRevenue?: number;
    revenueByMonth?: { month: string; year: number; revenue: number }[];
    totalBookings?: number;
    completedBookings?: number;
    platformFeeCollected?: number;
  } | null): RevenueReportDTO | null {
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
