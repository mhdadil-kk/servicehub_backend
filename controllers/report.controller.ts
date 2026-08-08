import { Request, Response } from "express";
import { IReportService } from "../interfaces/services/IReportService";
import { ReportMapper } from "../mappers/report.mapper";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { asyncHandler } from "../utils/async-handler";

export class ReportController {
  constructor(private _reportService: IReportService) {}

  createReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = { ...req.body };
    if (req.file) {
      data.screenshot = req.file.path;
    }
    const report = await this._reportService.createReport(userId, data);
    res.status(HttpStatusCode.CREATED).json(
      createSuccessResponse(ReportMapper.toResponse(report), SUCCESS_MESSAGES.REPORT_CREATED)
    );
  });

  getMyReports = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const reports = await this._reportService.getMyReports(userId);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(
        ReportMapper.toArrayResponse(reports),
        SUCCESS_MESSAGES.REPORTS_FETCHED
      )
    );
  });

  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role;
    const report = await this._reportService.getReportById(reportId, userId, role);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ReportMapper.toResponse(report), SUCCESS_MESSAGES.REPORTS_FETCHED)
    );
  });

  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
    const { reports, total } = await this._reportService.getAllReports(filter, page, limit);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(
        {
          reports: ReportMapper.toArrayResponse(reports),
          total,
          page,
          limit,
        },
        SUCCESS_MESSAGES.REPORTS_FETCHED
      )
    );
  });

  takeAction = asyncHandler(async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const { action, adminNotes } = req.body;

    const report = await this._reportService.takeAction(reportId, action, adminNotes);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ReportMapper.toResponse(report), SUCCESS_MESSAGES.REPORT_UPDATED)
    );
  });
}
