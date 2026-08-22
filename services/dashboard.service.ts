import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import {
  UPCOMING_BOOKING_STATUSES,
  ACTIVE_PROVIDER_BOOKING_STATUSES,
  COMPLETED_BOOKING_STATUS,
} from "../constants/statuses";
import { IDashboardService } from "../interfaces/services/IDashboardService";
import { DashboardStatsDTO } from "../dtos/dashboard.dto";
import { StatsMapper } from "../mappers/stats.mapper";

export class DashboardService implements IDashboardService {
  constructor(
    private _bookingRepository: IBookingRepository,
    private _transactionRepository: ITransactionRepository,
    private _providerProfileRepository: IProviderProfileRepository
  ) {}

  async getUserDashboard(userId: string): Promise<DashboardStatsDTO> {
    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalSpent,
      recentBookings,
    ] = await Promise.all([
      this._bookingRepository.countByUserId(userId),
      this._bookingRepository.countByUserId(userId, [...UPCOMING_BOOKING_STATUSES]),
      this._bookingRepository.countByUserId(userId, [COMPLETED_BOOKING_STATUS]),
      this._transactionRepository.sumByUserId(userId, "debit", "success"),
      this._bookingRepository.findRecentByUserId(userId, 5),
    ]);

    const rawStats: Record<string, unknown> = {
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalSpent,
      recentBookings,
    };

    return StatsMapper.toDashboardResponse(rawStats)!;
  }

  async getProviderDashboard(userId: string): Promise<DashboardStatsDTO> {
    const provider = await this._providerProfileRepository.findByUserId(userId);
    if (!provider) {
      const emptyStats: Record<string, unknown> = { 
        totalRequests: 0, 
        activeBookings: 0, 
        completedJobs: 0, 
        totalEarnings: 0, 
        recentBookings: [] 
      };
      return StatsMapper.toDashboardResponse(emptyStats)!;
    }
 
    const providerId = provider._id.toString();

    const [
      totalRequests,
      activeBookings,
      completedJobs,
      totalEarnings,
      recentBookings,
    ] = await Promise.all([
      this._bookingRepository.countByProviderId(providerId),
      this._bookingRepository.countByProviderId(providerId, [
        ...ACTIVE_PROVIDER_BOOKING_STATUSES,
      ]),
      this._bookingRepository.countByProviderId(providerId, [COMPLETED_BOOKING_STATUS]),
      this._transactionRepository.sumByUserId(userId, "credit", "success"),
      this._bookingRepository.findRecentByProviderId(providerId, 5),
    ]);

    const rawStats: Record<string, unknown> = {
      totalRequests,
      activeBookings,
      completedJobs,
      totalEarnings,
      recentBookings,
    };

    return StatsMapper.toDashboardResponse(rawStats)!;
  }
}
