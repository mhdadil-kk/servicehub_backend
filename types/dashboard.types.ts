import { IBooking } from "./booking.types";

export interface UserDashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent: number;
  recentBookings: IBooking[];
}

export interface ProviderDashboardStats {
  totalRequests: number;
  activeBookings: number;
  completedJobs: number;
  totalEarnings: number;
  recentBookings: IBooking[];
}