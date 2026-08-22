import { DashboardStatsDTO } from "../../dtos/dashboard.dto";

export interface IDashboardService {
  getUserDashboard(userId: string): Promise<DashboardStatsDTO>;
  getProviderDashboard(userId: string): Promise<DashboardStatsDTO>;
}
