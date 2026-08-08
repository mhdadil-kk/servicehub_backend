import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import {
  UPCOMING_BOOKING_STATUSES,
  ACTIVE_PROVIDER_BOOKING_STATUSES,
  COMPLETED_BOOKING_STATUS,
} from "../constants/statuses";
import { UserDashboardStats, ProviderDashboardStats } from "../types/dashboard.types";
import { IDashboardService } from "../interfaces/services/IDashboardService";

export class DashboardService implements IDashboardService {
  private _bookingRepository: IBookingRepository;
  private _transactionRepository: ITransactionRepository;
  private _providerProfileRepository: IProviderProfileRepository;
  
  constructor(
    bookingRepository: IBookingRepository,
    transactionRepository: ITransactionRepository,
    providerProfileRepository: IProviderProfileRepository
  ) {
    this._bookingRepository = bookingRepository;
    this._transactionRepository = transactionRepository;
    this._providerProfileRepository = providerProfileRepository;
  }

  async getUserDashboard(userId: string): Promise<UserDashboardStats> {
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

    return {
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalSpent,
      recentBookings,
    };
  }

  async getProviderDashboard(userId: string): Promise<ProviderDashboardStats> {
    const provider = await this._providerProfileRepository.findByUserId(userId);
    if (!provider) {
      return { totalRequests: 0, activeBookings: 0, completedJobs: 0, totalEarnings: 0, recentBookings: [] };
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

    return {
      totalRequests,
      activeBookings,
      completedJobs,
      totalEarnings,
      recentBookings,
    };
  }
}