import { Request, Response } from "express";
import { IReportService } from "../interfaces/services/IReportService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { asyncHandler } from "../utils/async-handler";

export class ReportController {
  constructor(private _reportService: IReportService) {}

  createReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const report = await this._reportService.createReport(userId, req.body);
    res.status(HttpStatusCode.CREATED).json(
      createSuccessResponse(report, SUCCESS_MESSAGES.REPORT_CREATED)
    );
  });

  getMyReports = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const reports = await this._reportService.getMyReports(userId);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse({ reports }, SUCCESS_MESSAGES.REPORTS_FETCHED)
    );
  });

  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const role = req.user!.role;
    const report = await this._reportService.getReportById(req.params.id as string, userId, role);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(report, SUCCESS_MESSAGES.REPORTS_FETCHED)
    );
  });

  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query;
    const result = await this._reportService.getAllReports(
      { status: status as string, search: search as string },
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse({
        reports: result.reports,
        pagination: {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          total: result.total,
          totalPages: Math.ceil(result.total / (Number(limit) || 10)),
        },
      }, SUCCESS_MESSAGES.REPORTS_FETCHED)
    );
  });

  takeAction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, adminNotes } = req.body;
    const report = await this._reportService.takeAction(id as string, action, adminNotes);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(report, SUCCESS_MESSAGES.REPORT_UPDATED)
    );
  });
}