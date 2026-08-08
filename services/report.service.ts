import { IReportRepository } from "../interfaces/repositories/IReportRepository";
import { IReportService, CreateReportInput } from "../interfaces/services/IReportService";
import { INotificationService } from "../interfaces/services/INotificationService";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IReport } from "../types/report.types";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";

export class ReportService implements IReportService {
  private _reportRepository: IReportRepository;
  private _notificationService: INotificationService;
  private _userRepository: IUserRepository;

  constructor(
    reportRepository: IReportRepository,
    notificationService: INotificationService,
    userRepository: IUserRepository
  ) {
    this._reportRepository = reportRepository;
    this._notificationService = notificationService;
    this._userRepository = userRepository;
  }

  async createReport(reporterId: string, data: CreateReportInput): Promise<IReport> {
    if (!data.reportedId || !data.category || !data.description) {
      throw new BadRequestError("Reported account, category, and description are required.");
    }

    const report = await this._reportRepository.create({
      reporterId,
      reportedId: data.reportedId,
      bookingId: data.bookingId ? data.bookingId : undefined,
      category: data.category,
      description: data.description,
      screenshot: data.screenshot,
      status: "pending",
      actionTaken: "none",
    });

    await this._notificationService.create({
      userId: reporterId,
      title: "Report Submitted Successfully",
      message: `Your report for category "${data.category}" has been received and is pending review.`,
      type: "success",
      relatedId: report.id,
    });

    return report;
  }

  async getMyReports(userId: string): Promise<IReport[]> {
    return this._reportRepository.findByReporterId(userId);
  }

  async getReportById(reportId: string, userId: string, role: string): Promise<IReport> {
    const report = await this._reportRepository.findById(reportId);
    if (!report) throw new NotFoundError("Report not found.");

    if (role !== "admin" && report.reporterId.toString() !== userId) {
      throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    return report;
  }

  async getAllReports(
    filter: { status?: string; search?: string } = {},
    page = 1,
    limit = 10
  ): Promise<{ reports: IReport[]; total: number }> {
    return this._reportRepository.findReports(filter, page, limit);
  }

  async takeAction(
    reportId: string,
    action: "warn" | "block" | "reject" | "resolve",
    adminNotes: string
  ): Promise<IReport> {
    const report = await this._reportRepository.findById(reportId);
    if (!report) throw new NotFoundError("Report not found.");

    let newStatus: "pending" | "under_review" | "resolved" | "rejected" = "resolved";
    let actionTaken: "warn" | "block" | "reject" | "resolve" | "none" = "none";
    
    const reporterUserId = (report.reporterId as unknown as { _id?: { toString: () => string } })?._id 
      ? (report.reporterId as unknown as { _id: { toString: () => string } })._id.toString() 
      : report.reporterId.toString();
      
    const reportedUserId = (report.reportedId as unknown as { _id?: { toString: () => string } })?._id 
      ? (report.reportedId as unknown as { _id: { toString: () => string } })._id.toString() 
      : report.reportedId.toString();

    if (action === "reject") {
      newStatus = "rejected";
      actionTaken = "reject";
    } else if (action === "warn") {
      newStatus = "resolved";
      actionTaken = "warn";

      await this._notificationService.create({
        userId: reportedUserId,
        title: "Account Warning Issued",
        message: `An admin has issued a warning to your account due to behavior reported under category: "${report.category}".`,
        type: "warning",
      });
    } else if (action === "block") {
      newStatus = "resolved";
      actionTaken = "block";

      await this._userRepository.updateById(reportedUserId, { isDeleted: true });

      await this._notificationService.create({
        userId: reportedUserId,
        title: "Account Blocked",
        message: `Your account has been blocked by an admin following reports for "${report.category}".`,
        type: "warning",
      });
    } else if (action === "resolve") {
      newStatus = "resolved";
      actionTaken = "resolve";
    }

    const updated = await this._reportRepository.update(reportId, {
      status: newStatus,
      actionTaken,
      adminNotes,
    });

    if (!updated) throw new NotFoundError("Failed to update report.");

    let reporterMsg = `The report you filed has been reviewed by our admin team and marked as ${newStatus}.`;
    if (action === "reject") {
      reporterMsg = `The report you filed has been rejected by our admin team.`;
    } else if (action === "warn" || action === "block") {
      reporterMsg = `The report you filed has been resolved. Action has been taken against the reported account.`;
    }

    await this._notificationService.create({
      userId: reporterUserId,
      title: "Report Status Update",
      message: reporterMsg,
      type: "info",
      relatedId: reportId,
    });

    return updated;
  }
}
