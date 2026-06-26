import { UserDashboardStats, ProviderDashboardStats } from "../../types/dashboard.types";

export interface IDashboardService {
  getUserDashboard(userId: string): Promise<UserDashboardStats>;
  getProviderDashboard(userId: string): Promise<ProviderDashboardStats>;
}
