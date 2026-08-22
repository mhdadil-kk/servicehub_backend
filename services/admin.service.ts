import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IServiceRepository } from "../interfaces/repositories/IServiceRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IReportRepository } from "../interfaces/repositories/IReportRepository";
import { IAdminService, AdminDashboardStats } from "../interfaces/services/IAdminService";
import { IUser } from "../types/user.types";
import { IService } from "../types/service.types";
import { IBooking } from "../types/booking.types";
import { IProviderProfile } from "../types/providerProfile.types";
import { NotFoundError, BadRequestError } from "../utils/error";
import { FilterQuery } from "mongoose";
import { UserResponseDTO } from "../dtos/auth.dto";
import { ServiceResponseDTO } from "../dtos/service.dto";
import { ProviderProfileResponseDTO } from "../dtos/provider.dto";
import { BookingResponseDTO, DetailedBookingResponseDTO } from "../dtos/booking.dto";
import { ReportResponseDTO } from "../dtos/report.dto";
import { RevenueReportDTO } from "../dtos/dashboard.dto";
import { UserMapper } from "../mappers/user.mapper";
import { ServiceMapper } from "../mappers/service.mapper";
import { ProviderProfileMapper } from "../mappers/providerProfile.mapper";
import { BookingMapper } from "../mappers/booking.mapper";
import { ReportMapper } from "../mappers/report.mapper";

export class AdminService implements IAdminService {
  constructor(
    private _userRepository: IUserRepository,
    private _serviceRepository: IServiceRepository,
    private _providerProfileRepository: IProviderProfileRepository,
    private _bookingRepository: IBookingRepository,
    private _transactionRepository: ITransactionRepository,
    private _reportRepository: IReportRepository
  ) {}

  async getAllUsers(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ users: UserResponseDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IUser> = { role: "user" };

    if (status) query.status = status as IUser["status"];
    if (search) query.name = { $regex: search, $options: "i" };

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const [users, total] = await Promise.all([
      this._userRepository.findAll(query, false, sortQuery, limit, skip),
      this._userRepository.count(query),
    ]);

    return {
      users: (UserMapper.toResponse(users) as UserResponseDTO[]) || [],
      total,
    };
  }

  async getProviders(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ providers: UserResponseDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IUser> = { role: "provider" };

    if (status) query.status = status as IUser["status"];
    if (search) query.name = { $regex: search, $options: "i" };

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const [providers, total] = await Promise.all([
      this._userRepository.findAll(query, false, sortQuery, limit, skip),
      this._userRepository.count(query),
    ]);

    return {
      providers: (UserMapper.toResponse(providers) as UserResponseDTO[]) || [],
      total,
    };
  }

  async updateUserStatus(id: string, status: string): Promise<UserResponseDTO> {
    const user = await this._userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const updated = await this._userRepository.updateById(id, { status } as Partial<IUser>);
    return UserMapper.toResponse(updated) as UserResponseDTO;
  }

  async unblockUser(id: string): Promise<UserResponseDTO> {
    const user = await this._userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");

    const updated = await this._userRepository.updateById(id, { isDeleted: false, status: "approved" });
    return UserMapper.toResponse(updated) as UserResponseDTO;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this._userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    await this._userRepository.softDelete(id);
  }

  async addService(data: Partial<IService>): Promise<ServiceResponseDTO> {
    if (!data.name || !data.description) {
      throw new BadRequestError("Name and description are required");
    }

    try {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const created = await this._serviceRepository.create({
        ...data,
        slug,
        isActive: true,
      });
      return ServiceMapper.toResponse(created)!;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message || "Failed to create service category");
      }
      throw new BadRequestError("Failed to create service category");
    }
  }

  async getAllServices(): Promise<ServiceResponseDTO[]> {
    const services = await this._serviceRepository.findAll();
    return ServiceMapper.toArrayResponse(services);
  }

  async deleteService(id: string): Promise<void> {
    const service = await this._serviceRepository.findById(id);
    if (!service) throw new NotFoundError("Service category not found");
    await this._serviceRepository.softDelete(id);
  }

  async getPendingProviders(): Promise<ProviderProfileResponseDTO[]> {
    const pending = await this._providerProfileRepository.findPendingProviders();
    return ProviderProfileMapper.toArrayResponse(pending) as ProviderProfileResponseDTO[];
  }

  async getProviderDetail(userId: string): Promise<ProviderProfileResponseDTO | null> {
    const profile = await this._providerProfileRepository.findByUserIdWithDetails(userId);
    if (!profile) throw new NotFoundError("Provider profile not found");
    return ProviderProfileMapper.toResponse(profile) as ProviderProfileResponseDTO;
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
    const userDateFilter = timeRange && timeRange !== "all" ? { createdAt: { $gte: startDate } } : {};

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
    userGrowthData.forEach((d: { _id: Record<string, number | string>; count: number }) => {
      const year = d._id["year"] as number;
      const month = d._id["month"] as number | undefined;
      const day = d._id["day"] as number | undefined;
      const role = d._id["role"] as string;

      let label = `${year}`;
      if (timeRange === "year" && month) {
        label = `${MONTH_NAMES[month - 1]} ${year}`;
      } else if (timeRange === "month" && day) {
        label = `${day}`;
      }
      if (!growthMap.has(label)) {
        growthMap.set(label, { label, users: 0, providers: 0 });
      }
      const entry = growthMap.get(label)!;
      if (role === "user") entry.users = d.count;
      else if (role === "provider") entry.providers = d.count;
    });

    const userGrowth = Array.from(growthMap.values());

    const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-pink-500"];
    const bookingTrends = bookingTrendsData.map((d: { _id: string; count: number }, i: number) => ({
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

  async getAllBookings(search?: string, status?: string, sort?: string, page: number = 1, limit: number = 10): Promise<{ bookings: (BookingResponseDTO | DetailedBookingResponseDTO)[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IBooking> = {};

    if (status) query.status = status as IBooking["status"];

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

    return {
      bookings: BookingMapper.toArrayResponse(bookings, true),
      total
    };
  }

  async getBookingById(id: string): Promise<DetailedBookingResponseDTO | null> {
    const booking = await this._bookingRepository.findByIdPopulated(id);
    if (!booking) throw new NotFoundError("Booking not found");
    return BookingMapper.toDetailedResponse(booking);
  }

  async getRevenueReport(timeRange?: string): Promise<RevenueReportDTO> {
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

  async getAllReports(status?: string, page: number = 1, limit: number = 10): Promise<{ reports: ReportResponseDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (status) filter["status"] = status;

    const [reports, total] = await Promise.all([
      this._reportRepository.findAllPopulated(filter, false, { createdAt: -1 }, limit, skip),
      this._reportRepository.count(filter),
    ]);

    return {
      reports: ReportMapper.toArrayResponse(reports),
      total,
    };
  }

  async resolveReport(reportId: string, action: string, resolutionNotes?: string): Promise<ReportResponseDTO> {
    const report = await this._reportRepository.findById(reportId);
    if (!report) throw new NotFoundError("Report not found");

    const updated = await this._reportRepository.update(reportId, {
      status: "resolved",
      actionTaken: action,
      adminNotes: resolutionNotes,
    });
    if (!updated) throw new NotFoundError("Failed to update report");

    return ReportMapper.toResponse(updated)!;
  }
}
