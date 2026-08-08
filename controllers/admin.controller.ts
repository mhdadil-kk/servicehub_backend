import { Request, Response } from "express";
import { IAdminService } from "../interfaces/services/IAdminService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { asyncHandler } from "../utils/async-handler";


export class AdminController {
  constructor(private _adminService: IAdminService) {}

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, sort, page, limit } = req.query;
    const result = await this._adminService.getAllUsers(
      search as string,
      status as string,
      sort as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
  });

  getProviders = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, sort, page, limit } = req.query;
    const result = await this._adminService.getProviders(
      search as string,
      status as string,
      sort as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
  });

  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await this._adminService.updateUserStatus(id, status);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(updated, "Status updated"));
  });

  unblockUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await this._adminService.unblockUser(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(updated, "User unblocked"));
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this._adminService.deleteUser(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "User deleted"));
  });

  addService = asyncHandler(async (req: Request, res: Response) => {
    const result = await this._adminService.addService(req.body);
    res.status(HttpStatusCode.CREATED).json(createSuccessResponse(result, "Service added"));
  });

  getAllServices = asyncHandler(async (req: Request, res: Response) => {
    const services = await this._adminService.getAllServices();
    res.status(HttpStatusCode.OK).json(createSuccessResponse(services));
  });

  deleteService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this._adminService.deleteService(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Service deleted"));
  });

  getPendingProviders = asyncHandler(async (req: Request, res: Response) => {
    const pending = await this._adminService.getPendingProviders();
    res.status(HttpStatusCode.OK).json(createSuccessResponse(pending));
  });

  getProviderDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const detail = await this._adminService.getProviderDetail(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(detail));
  });

  updateProviderVerification = asyncHandler(async (req: Request, res: Response) => {
    const { providerId } = req.params;
    const { status, reason } = req.body;
    const updated = await this._adminService.updateProviderVerification(providerId, status, reason);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(updated, "Verification status updated"));
  });

  getAdminStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this._adminService.getAdminStats();
    res.status(HttpStatusCode.OK).json(createSuccessResponse(stats));
  });

  getAdminRevenue = asyncHandler(async (req: Request, res: Response) => {
    const { timeRange } = req.query;
    const revenue = await this._adminService.getAdminRevenue(timeRange as string);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(revenue));
  });

  getUserGrowth = asyncHandler(async (req: Request, res: Response) => {
    const { timeRange } = req.query;
    const growth = await this._adminService.getUserGrowth(timeRange as string);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(growth));
  });

  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;
    const reports = await this._adminService.getAllReports(
      status as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(reports));
  });

  resolveReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { action, resolutionNotes } = req.body;
    const resolved = await this._adminService.resolveReport(reportId, action, resolutionNotes);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(resolved, "Report resolved"));
  });
}
