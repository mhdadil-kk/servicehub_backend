import ReportModel, { IReportDocument } from "../models/report.model";
import { IReport } from "../types/report.types";
import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { IReportRepository } from "../interfaces/repositories/IReportRepository";

export class ReportRepository implements IReportRepository {
  async create(data: Partial<IReport>): Promise<IReport> {
    const report = await ReportModel.create(
      data as unknown as Partial<IReportDocument>
    );

    return {
      ...report.toObject(),
      id: report._id.toString(),
    } as IReport;
  }

  async findById(id: string): Promise<IReport | null> {
    return ReportModel.findById(id)
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .exec() as unknown as IReport | null;
  }

  async findByIdPopulated(id: string): Promise<IReport | null> {
    return this.findById(id);
  }

  async findByReporterId(reporterId: string): Promise<IReport[]> {
    return ReportModel.find({
      reporterId,
    } as FilterQuery<IReportDocument>)
      .populate("reportedId", "name email profilePhoto role")
      .sort({ createdAt: -1 })
      .exec() as unknown as IReport[];
  }

  async findAllPopulated(
    filter: FilterQuery<IReport> = {},
    sort: Record<string, SortOrder> = { createdAt: -1 },
    limit = 10,
    skip = 0
  ): Promise<IReport[]> {
    return ReportModel.find(filter as FilterQuery<IReportDocument>)
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
        .find({
          name: {
            $regex: filter.search,
            $options: "i",
          },
        })
        .select("_id")
        .exec();

      const userIds = matchedUsers.map((u) => u._id);

      query.$or = [
        { reporterId: { $in: userIds } },
        { reportedId: { $in: userIds } },
      ];
    }

    const [reports, total] = await Promise.all([
      ReportModel.find(query)
        .populate("reporterId", "name email phone profilePhoto role")
        .populate("reportedId", "name email phone profilePhoto role")
        .populate("bookingId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      ReportModel.countDocuments(query).exec(),
    ]);

    return {
      reports: reports as unknown as IReport[],
      total,
    };
  }

  async update(
    id: string,
    data: Partial<IReport>
  ): Promise<IReport | null> {
    return ReportModel.findByIdAndUpdate(
      id,
      data as unknown as mongoose.UpdateQuery<IReportDocument>,
      {
        returnDocument: "after",
      }
    )
      .populate("reporterId", "name email phone profilePhoto role")
      .populate("reportedId", "name email phone profilePhoto role")
      .populate("bookingId")
      .exec() as unknown as IReport | null;
  }

  async count(filter: FilterQuery<IReport> = {}): Promise<number> {
    return ReportModel.countDocuments(
      filter as FilterQuery<IReportDocument>
    ).exec();
  }
}