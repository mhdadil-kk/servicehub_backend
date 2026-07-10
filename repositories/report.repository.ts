import ReportModel, { IReport } from "../models/report.model";
import { BaseRepository } from "./base.repository";
import mongoose, { FilterQuery } from "mongoose";
import { IReportRepository } from "../interfaces/repositories/IReportRepository";

export class ReportRepository
  extends BaseRepository<IReport>
  implements IReportRepository
{
  constructor() {
    super(ReportModel);
  }

  async create(data: Partial<IReport>): Promise<IReport> {
    return super.create(data);
  }

  async findById(id: string): Promise<IReport | null> {
    return this.model
      .findById(id)
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .exec();
  }

  async findByReporterId(reporterId: string): Promise<IReport[]> {
    return this.model
      .find({ reporterId } as FilterQuery<IReport>)
      .populate("reportedId", "name email profilePhoto role")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findReports(
    filter: { status?: string; search?: string } = {},
    page = 1,
    limit = 10
  ): Promise<{ reports: IReport[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IReport> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.search) {
      const userModel = mongoose.model("User");
      const matchedUsers = await userModel
        .find({ name: { $regex: filter.search, $options: "i" } })
        .select("_id")
        .exec();
      const userIds = matchedUsers.map((u) => u._id);
      query.$or = [
        { reporterId: { $in: userIds } },
        { reportedId: { $in: userIds } },
      ];
    }

    const [reports, total] = await Promise.all([
      this.model
        .find(query)
        .populate("reporterId", "name email phone profilePhoto role")
        .populate("reportedId", "name email phone profilePhoto role")
        .populate("bookingId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { reports, total };
  }

  async update(id: string, data: Partial<IReport>): Promise<IReport | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true })
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .exec();
  }
}
