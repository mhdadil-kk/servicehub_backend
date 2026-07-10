import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IUser } from "../types/user.types";
import mongoose, { FilterQuery } from "mongoose";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { ServiceRepository } from "../repositories/service.repository";
import { IService } from "../models/service.model";
import ProviderProfile from "../models/providerProfile.model";
import BookingModel from "../models/booking.model";
import TransactionModel from "../models/transaction.model";
import ReportModel from "../models/report.model";
import { IAdminService, AdminDashboardStats } from "../interfaces/services/IAdminService";

export class AdminService implements IAdminService {
  private _userRepository: IUserRepository;
  private _serviceRepository: ServiceRepository;

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository;
    this._serviceRepository = new ServiceRepository();
  }

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

    let sortQuery: Record<string, number> = { created_at: -1 };
    if (sort === "oldest") sortQuery = { created_at: 1 };
    if (sort === "name_asc") sortQuery = { name: 1 };
    if (sort === "name_desc") sortQuery = { name: -1 };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this._userRepository.findAll(filter, true, sortQuery, limit, skip),
      this._userRepository.count(filter, true)
    ]);

    return { users, total };
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

    let sortQuery: Record<string, number> = { created_at: -1 };
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

    const updatedUser = await this._userRepository.update(id, { status });
    if (!updatedUser) throw new NotFoundError("User could not be updated");

    return updatedUser;
  }

  async unblockUser(id: string): Promise<IUser> {
    const user = await this._userRepository.findById(id, true);
    if (!user) throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);

    const updatedUser = await this._userRepository.update(id, { isDeleted: false });
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
      if ((existingService as any).isDeleted) {
        return await this._serviceRepository.update(existingService._id, {
          description: data.description,
          isDeleted: false,
          isActive: true
        }) as IService;
      }
      throw new BadRequestError("A service with this name already exists");
    }

    try {
      return await this._serviceRepository.create(data as IService);
    } catch (error: any) {

      throw new BadRequestError(error.message || "Failed to create service category");
    }
  }

  async getAllServices(): Promise<IService[]> {
    return await this._serviceRepository.findAll();
  }

  async deleteService(id: string): Promise<void> {
    const service = await this._serviceRepository.findById(id);
    if (!service) throw new NotFoundError("Service category not found");
    await this._serviceRepository.softDelete(id);
  }

  async getPendingProviders(): Promise<any[]> {
    return await ProviderProfile.find({ onboardingStatus: "in_review" })
      .populate("userId", "name email phone")
      .populate("serviceId", "name");
  }

  async getProviderDetail(userId: string): Promise<any> {
    const profile = await ProviderProfile.findOne({ userId })
      .populate("userId", "name email phone role status")
      .populate("serviceId", "name description");
    
    if (!profile) throw new NotFoundError("Provider profile not found");
    return profile;
  }

  async verifyProvider(userId: string, status: "approved" | "rejected", remarks?: string): Promise<void> {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new NotFoundError("Provider profile not found");

    profile.onboardingStatus = status;
    if (status === "rejected") {
      profile.rejectionReason = remarks || "No reason provided";
    } else {
      profile.rejectionReason = undefined;
    }
    
    await profile.save();

    if (status === "approved") {
      await this._userRepository.update(userId, { is_verified: true, status: "active" });
    } else {
      await this._userRepository.update(userId, { status: "rejected" });
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

    const [
      totalUsers,
      totalProviders,
      totalBookings,
      revenueResult,
      pendingProviders,
      openReports,
      userGrowthData,
      bookingTrendsData
    ] = await Promise.all([
      mongoose.model("User").countDocuments({ role: "user", isDeleted: { $ne: true }, ...dateFilter }),
      mongoose.model("User").countDocuments({ role: "provider", isDeleted: { $ne: true }, ...dateFilter }),
      BookingModel.countDocuments({ ...dateFilter }),
      TransactionModel.aggregate([
        { $match: { status: "success", type: "credit", ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      ProviderProfile.countDocuments({ onboardingStatus: "in_review", ...dateFilter }),
      ReportModel.countDocuments({ status: "pending", ...dateFilter }),
      
      mongoose.model("User").aggregate([
        { $match: { role: "user", isDeleted: { $ne: true }, ...dateFilter } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      BookingModel.aggregate([
        { $match: { status: "completed", ...dateFilter } },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service"
          }
        },
        { $unwind: "$service" },
        {
          $group: {
            _id: "$service.name",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const userGrowth = userGrowthData.map((d: any) => ({
      month: `${monthNames[d._id.month - 1]} ${d._id.year}`,
      value: d.count
    }));

    const colors = ["bg-blue-600", "bg-blue-500", "bg-blue-400", "bg-blue-300", "bg-blue-200"];
    const bookingTrends = bookingTrendsData.map((d: any, i: number) => ({
      label: d._id,
      val: d.count,
      color: colors[i % colors.length]
    }));

    return {
      totalUsers,
      totalProviders,
      totalBookings,
      totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
      pendingProviders,
      openReports,
      userGrowth,
      bookingTrends
    };
  }

  async getAllBookings(search?: string, status?: string, sort?: string, page = 1, limit = 10): Promise<{ bookings: any[], total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<any> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const users = await this._userRepository.find({ name: { $regex: search, $options: "i" } } as any);
      const userIds = users.map(u => u._id);
      
      const providers = await ProviderProfile.find({ userId: { $in: userIds } });
      const providerProfileIds = providers.map(p => p._id);

      query.$or = [
        { userId: { $in: userIds } },
        { providerId: { $in: providerProfileIds } },
        { _id: search.length === 24 ? search : undefined } 
      ].filter(Boolean);
    }

    let sortQuery: any = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    if (sort === "amount_high") sortQuery = { totalAmount: -1 };
    if (sort === "amount_low") sortQuery = { totalAmount: 1 };

    const [bookings, total] = await Promise.all([
      BookingModel.find(query)
        .populate("userId", "name email phone profilePhoto")
        .populate({
          path: "providerId",
          populate: {
            path: "userId",
            select: "name email phone profilePhoto"
          }
        })
        .populate("serviceId", "name")
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      BookingModel.countDocuments(query).exec(),
    ]);

    return { bookings, total };
  }

  async getBookingById(id: string): Promise<any> {
    const booking = await BookingModel.findById(id)
      .populate("userId", "name email phone profilePhoto")
      .populate({
        path: "providerId",
        populate: {
          path: "userId",
          select: "name email phone profilePhoto"
        }
      })
      .populate("serviceId", "name description basePrice")
      .populate("addressId")
      .exec();

    if (!booking) throw new NotFoundError("Booking not found");
    return booking;
  }
}
