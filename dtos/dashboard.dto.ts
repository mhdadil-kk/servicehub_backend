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
