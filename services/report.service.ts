import { IReportRepository } from "../interfaces/repositories/IReportRepository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import { INotificationService } from "../interfaces/services/INotificationService";
import { IReportService } from "../interfaces/services/IReportService";
import { NotFoundError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { ReportResponseDTO, CreateReportInputDTO } from "../dtos/report.dto";
import { ReportMapper } from "../mappers/report.mapper";
import mongoose from "mongoose";

export class ReportService implements IReportService {
  constructor(
    private _reportRepository: IReportRepository,
    private _userRepository: IUserRepository,
    private _bookingRepository: IBookingRepository,
    private _notificationService: INotificationService
  ) {}

  async createReport(reporterId: string, data: CreateReportInputDTO): Promise<ReportResponseDTO> {
    const reportedUser = await this._userRepository.findById(data.reportedId);
    if (!reportedUser) throw new NotFoundError("Reported user not found");

    if (data.bookingId) {
      const booking = await this._bookingRepository.findById(data.bookingId);
      if (!booking) throw new NotFoundError(ERROR_MESSAGES.BOOKING_NOT_FOUND);
    }

    const report = await this._reportRepository.create({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      reportedId: new mongoose.Types.ObjectId(data.reportedId),
      bookingId: data.bookingId ? new mongoose.Types.ObjectId(data.bookingId) : undefined,
      category: data.category,
      description: data.description,
      screenshot: data.screenshot,
      status: "pending",
    });

    return ReportMapper.toResponse(report)!;
  }

  async getMyReports(userId: string): Promise<ReportResponseDTO[]> {
    const reports = await this._reportRepository.findAllPopulated({ reporterId: new mongoose.Types.ObjectId(userId) });
    return ReportMapper.toArrayResponse(reports);
  }

  async getReportById(reportId: string, userId: string, role: string): Promise<ReportResponseDTO> {
    const report = await this._reportRepository.findByIdPopulated(reportId);
    if (!report) throw new NotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);

    if (role !== "admin" && report.reporterId.toString() !== userId && report.reportedId.toString() !== userId) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED_ACTION);
    }

    return ReportMapper.toResponse(report)!;
  }

  async getAllReports(filter: { status?: string; search?: string }, page: number = 1, limit: number = 10): Promise<{ reports: ReportResponseDTO[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;

    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this._reportRepository.findAllPopulated(query, { createdAt: -1 }, limit, skip),
      this._reportRepository.count(query),
    ]);

    return {
      reports: ReportMapper.toArrayResponse(reports),
      total,
    };
  }

  async takeAction(reportId: string, action: "warn" | "block" | "reject" | "resolve", adminNotes: string): Promise<ReportResponseDTO> {
    const report = await this._reportRepository.findById(reportId);
    if (!report) throw new NotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);

    const updated = await this._reportRepository.update(reportId, {
      status: action === "reject" ? "rejected" : "resolved",
      actionTaken: action,
      adminNotes,
    });

    if (!updated) throw new NotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);

    if (action === "warn" || action === "block") {
      await this._notificationService.create({
        userId: report.reportedId.toString(),
        title: action === "warn" ? "Warning" : "Account Blocked",
        message: `An action has been taken against your account regarding a recent report.`,
        type: "warning",
      });
    }

    return ReportMapper.toResponse(updated)!;
  }
}