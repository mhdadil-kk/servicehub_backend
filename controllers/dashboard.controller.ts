import { Request, Response, NextFunction } from "express";
import { IDashboardService } from "../interfaces/services/IDashboardService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class DashboardController {
  private readonly _dashboardService: IDashboardService;
  constructor(dashboardService: IDashboardService) {
    this._dashboardService = dashboardService;
  }

  getUserDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const stats = await this._dashboardService.getUserDashboard(userId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(stats, SUCCESS_MESSAGES.USER_DASHBOARD_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getProviderDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const stats = await this._dashboardService.getProviderDashboard(userId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(stats, SUCCESS_MESSAGES.PROVIDER_DASHBOARD_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };
}