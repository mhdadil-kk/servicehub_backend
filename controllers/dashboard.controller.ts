import { Request, Response } from "express";
import { IDashboardService } from "../interfaces/services/IDashboardService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { StatsMapper } from "../mappers/stats.mapper";
import { asyncHandler } from "../utils/async-handler";


export class DashboardController {
  constructor(private _dashboardService: IDashboardService) {}

  getUserDashboard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await this._dashboardService.getUserDashboard(userId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(StatsMapper.toDashboardResponse(stats), SUCCESS_MESSAGES.USER_DASHBOARD_FETCHED)
    );
  });

  getProviderDashboard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await this._dashboardService.getProviderDashboard(userId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(StatsMapper.toDashboardResponse(stats), SUCCESS_MESSAGES.PROVIDER_DASHBOARD_FETCHED)
    );
  });
}