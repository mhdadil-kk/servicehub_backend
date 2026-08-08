import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IUser } from "../types/user.types";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IReportRepository } from "../interfaces/repositories/IReportRepository";
import { IServiceRepository } from "../interfaces/repositories/IServiceRepository";
import { AdminDashboardStats, IAdminService } from "../interfaces/services/IAdminService";
import { IService } from "../types/service.types";
import { IProviderProfile } from "../types/providerProfile.types";
import { IBooking } from "../types/booking.types";
import { FilterQuery } from "mongoose";

export class AdminService implements IAdminService {
  constructor(
    private _userRepository: IUserRepository,
    private _serviceRepository: IServiceRepository,
    private _providerProfileRepository: IProviderProfileRepository,
    private _bookingRepository: IBookingRepository,
    private _transactionRepository: ITransactionRepository,
    private _reportRepository: IReportRepository
  ) {}

  async getAllUsers(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ users: IUser[], total: number }> {
    const filter: FilterQuery<IUser> = { role: "user" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (status === "active") filter.isDeleted = { $ne: true };
    if (status === "blocked") filter.isDeleted = true;

    let sortQuery: Record<string, 1 | -1> = { created_at: -1 };
    if (sort === "oldest") sortQuery = { created_at: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const skip = (page - 1) * limit;
    const [rawUsers, total] = await Promise.all([
      this._userRepository.findAll(filter, true, sortQuery, limit, skip),
      this._userRepository.count(filter, true)
      
    ]);

    const userWithCounts = await Promise.all(
      rawUsers.map(async (user: IUser & { toObject?: () => IUser; _id?: { toString: () => string } })=> {
       const userIdString = user._id ? user._id.toString() : user.id;
       const bookingCount = await this._bookingRepository.countByUserId(userIdString)
        
       return {
        ...(user.toObject ? user.toObject() : user),
        totalBookings: bookingCount
       } as IUser;
      })
    )

    return { users: userWithCounts, total };
  }

  async getProviders(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ providers: IUser[], total: number }> {
    const filter: FilterQuery<IUser> = { role: "provider" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (status === "active") filter.isDeleted = { $ne: true };
    if (status === "blocked") filter.isDeleted = true;
    if (status === "pending") filter.status = "pending";
    if (status === "approved") filter.status = "approved";
    if (status === "rejected") filter.status = "rejected";

    let sortQuery: Record<string, 1 | -1> = { created_at: -1 };
    if (sort === "oldest") sortQuery = { created_at: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const skip = (page - 1) * limit;
    const [providers, total] = await Promise.all([
      this._userRepository.findAll(filter, true, sortQuery, limit, skip),
      this._userRepository.count(filter, true)
    ]);

    return { providers, total };
  }

  async updateUserStatus(id: string, status: string): Promise<IUser> {
    if (!["approved", "rejected", "pending"].includes(status)) {
      throw new BadRequestError("Invalid status value");
    }

    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this._userRepository.update(id, { status } as Partial<IUser>);
    if (!updatedUser) throw new NotFoundError("User could not be updated");

    return updatedUser;
  }

  async unblockUser(id: string): Promise<IUser> {
    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this._userRepository.update(id, { isDeleted: false } as Partial<IUser>);
    if (!updatedUser) throw new NotFoundError("User could not be updated");

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    await this._userRepository.softDelete(id);
  }

  async addService(data: Partial<IService>): Promise<IService> {
    if (!data.name || !data.description) {
      throw new BadRequestError("Name and description are required");
    }

    const existingService = await this._serviceRepository.findOne({ name: data.name }, true);
    
    if (existingService) {
      if (existingService.isDeleted) {
        return await this._serviceRepository.update((existingService as IService & { _id?: { toString: () => string } })._id?.toString() || existingService.id, {
          description: data.description,
          isDeleted: false,
          isActive: true
        } as Partial<IService>) as IService;
      }
      throw new BadRequestError("A service with this name already exists");
    }

    try {
      return await this._serviceRepository.create(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message || "Failed to create service category");
      }
      throw new BadRequestError("Failed to create service category");
    }
  }

  async getAllServices(): Promise<IService[]> {
    return (await this._serviceRepository.findAll()) as unknown as IService[];
  }

  async deleteService(id: string): Promise<void> {
    const service = await this._serviceRepository.findById(id);
    if (!service) throw new NotFoundError("Service category not found");
    await this._serviceRepository.softDelete(id);
  }

  async getPendingProviders(): Promise<IProviderProfile[]> {
    return await this._providerProfileRepository.findPendingProviders();
  }

  async getProviderDetail(userId: string): Promise<IProviderProfile | null> {
    const profile = await this._providerProfileRepository.findByUserIdWithDetails(userId);
    if (!profile) throw new NotFoundError("Provider profile not found");
    return profile;
  }

  async verifyProvider(userId: string, status: "approved" | "rejected", remarks?: string): Promise<void> {
    const profile = await this._providerProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError("Provider profile not found");

    const updateData: Partial<IProviderProfile> = { onboardingStatus: status };
    if (status === "rejected") {
      updateData.rejectionReason = remarks || "No reason provided";
    } else {
      updateData.rejectionReason = undefined;
    }
    
    await this._providerProfileRepository.updateByUserId(userId, updateData);

    if (status === "approved") {
      await this._userRepository.updateById(userId, { is_verified: true, status: "approved" } as Partial<IUser>);
    } else {
      await this._userRepository.updateById(userId, { status: "rejected" } as Partial<IUser>);
    }
  }

  async getDashboardStats(timeRange?: string): Promise<AdminDashboardStats> {
    const now = new Date();
    let startDate = new Date(0); 

    if (timeRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const dateFilter = timeRange && timeRange !== "all" ? { createdAt: { $gte: startDate } } : {};
    const userDateFilter = timeRange && timeRange !== "all" ? { created_at: { $gte: startDate } } : {};

    const [
      totalUsers,
      totalProviders,
      totalBookings,
      paidBookingsCount,
      pendingProviders,
      openReports,
      userGrowthData,
      bookingTrendsData
    ] = await Promise.all([
      this._userRepository.countByRole("user", userDateFilter),
      this._userRepository.countByRole("provider", userDateFilter),
      this._bookingRepository.countByFilter({ ...dateFilter }),
      this._bookingRepository.countByFilter({
        paymentStatus: { $in: ["paid", "fully_paid"] },
        status: { $in: ["confirmed", "completed", "in_progress", "completed_pending_payment"] },
        ...dateFilter
      }),
      this._providerProfileRepository.countByStatus("in_review", dateFilter),
      this._reportRepository.count({ status: "pending", ...dateFilter }),
      this._userRepository.getUserGrowth(userDateFilter, timeRange),
      this._bookingRepository.getServiceBookingTrends(dateFilter)
    ]);

    const PLATFORM_FEE = 100;

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const growthMap = new Map<string, { label: string; users: number; providers: number }>();
    userGrowthData.forEach((d: { _id: { year: number; month: number; day: number; role: string }, count: number }) => {
      let label = `${d._id.year}`;
      if (timeRange === "year") {
        label = `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`;
      } else if (timeRange === "month") {
        label = `${d._id.day}`;
      }
      if (!growthMap.has(label)) {
        growthMap.set(label, { label, users: 0, providers: 0 });
      }
      const entry = growthMap.get(label)!;
      if (d._id.role === "user") entry.users = d.count;
      else if (d._id.role === "provider") entry.providers = d.count;
    });

    const userGrowth = Array.from(growthMap.values());

    const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-pink-500"];
    const bookingTrends = bookingTrendsData.map((d: { _id: string, count: number }, i: number) => ({
      label: d._id,
      val: d.count,
      color: COLORS[i % COLORS.length]
    }));

    return {
      totalUsers,
      totalProviders,
      totalBookings,
      totalRevenue: paidBookingsCount * PLATFORM_FEE,
      pendingProviders,
      openReports,
      userGrowth,
      bookingTrends
    };
  }

  async getAllBookings(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ bookings: IBooking[], total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IBooking> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const userIds = await this._userRepository.findIdsByRoleAndName("user", search);
      const providerProfileIds = await this._providerProfileRepository.findIdsByUserIds(
        await this._userRepository.findIdsByRoleAndName("provider", search)
      );

      query.$or = [
        { userId: { $in: userIds } },
        { providerId: { $in: providerProfileIds } },
        { _id: search.length === 24 ? search : undefined } 
      ].filter(Boolean) as FilterQuery<IBooking>["$or"];
    }

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    if (sort === "amount_high") sortQuery = { totalAmount: -1 };
    if (sort === "amount_low") sortQuery = { totalAmount: 1 };

    const [bookings, total] = await Promise.all([
      this._bookingRepository.findAllWithFilters(query, sortQuery, skip, limit),
      this._bookingRepository.countByFilter(query),
    ]);

    return { bookings: bookings as unknown as IBooking[], total };
  }

  async getBookingById(id: string): Promise<IBooking | null> {
    const booking = await this._bookingRepository.findByIdPopulated(id);
     if (!booking) throw new NotFoundError("Booking not found");
    return booking as unknown as IBooking;
  }

  async getRevenueReport(timeRange?: string): Promise<{
    totalRevenue: number;
    revenueByMonth: { month: string; year: number; revenue: number }[];
    totalBookings: number;
    completedBookings: number;
    platformFeeCollected: number;
  }> {
    const now = new Date();
    let startDate = new Date(0);

    if (timeRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const dateFilter = timeRange && timeRange !== "all" ? { createdAt: { $gte: startDate } } : {};
    const PLATFORM_FEE = 100;

    const [paidBookingsCount, revenueByMonthRaw, totalBookings, completedBookings] = await Promise.all([
      this._bookingRepository.countByFilter({
        paymentStatus: { $in: ["paid", "fully_paid"] },
        status: { $in: ["confirmed", "completed", "in_progress", "completed_pending_payment"] },
        ...dateFilter
      }),
      this._bookingRepository.getPlatformRevenueByMonth(dateFilter),
      this._bookingRepository.countByFilter({ ...dateFilter }),
      this._bookingRepository.countByFilter({ status: "completed", ...dateFilter }),
    ]);

    const revenueByMonth = revenueByMonthRaw.map((r) => ({
      month: r.month,
      year: r.year,
      revenue: r.count * PLATFORM_FEE,
    }));

    const totalRevenue = paidBookingsCount * PLATFORM_FEE;

    return {
      totalRevenue,
      revenueByMonth,
      totalBookings,
      completedBookings,
      platformFeeCollected: totalRevenue,
    };
  }



}
