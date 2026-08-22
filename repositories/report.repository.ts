import ReportModel, { IReportDocument } from "../models/report.model";
import { IReport } from "../types/report.types";
import { BaseRepository } from "./base.repository";
import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { IReportRepository } from "../interfaces/repositories/IReportRepository";

export class ReportRepository
  extends BaseRepository<IReportDocument>
  implements IReportRepository
{
  constructor() {
    super(ReportModel);
  }

  async create(data: Partial<IReport>): Promise<IReport> {
    return super.create(data as unknown as Partial<IReportDocument>) as unknown as IReport;
  }

  async findById(id: string): Promise<IReport | null> {
    return this.model
      .findById(id)
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .exec() as unknown as IReport | null;
  }

  async findByIdPopulated(id: string): Promise<IReport | null> {
    return this.findById(id);
  }

  async findByReporterId(reporterId: string): Promise<IReport[]> {
    return this.model
      .find({ reporterId } as FilterQuery<IReportDocument>)
      .populate("reportedId", "name email profilePhoto role")
      .sort({ createdAt: -1 })
      .exec() as unknown as IReport[];
  }

  async findAllPopulated(
    filter: FilterQuery<IReportDocument> = {},
    sort: Record<string, SortOrder> = { createdAt: -1 },
    limit = 10,
    skip = 0
  ): Promise<IReport[]> {
    return this.model
      .find(filter)
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .exec() as unknown as IReport[];
  }

  async findReports(
    filter: { status?: string; search?: string } = {},
    page = 1,
    limit = 10
  ): Promise<{ reports: IReport[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IReportDocument> = {};

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

    return { reports: reports as unknown as IReport[], total };
  }

  async update(id: string, data: Partial<IReport>): Promise<IReport | null> {
    return this.model
      .findByIdAndUpdate(id, data as unknown as mongoose.UpdateQuery<IReportDocument>, { returnDocument: "after" })
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .exec() as unknown as IReport | null;
  }
}