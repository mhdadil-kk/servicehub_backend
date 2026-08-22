import { Request, Response } from "express";
import { IAdminService } from "../interfaces/services/IAdminService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { asyncHandler } from "../utils/async-handler";
import { BadRequestError } from "../utils/error";

function paramId(value: string | string[]): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) throw new BadRequestError("Missing resource id");
  return id;
}

export class AdminController {
  constructor(private _adminService: IAdminService) {}

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, sort, page, limit } = req.query;
    const result = await this._adminService.getAllUsers(
      search as string | undefined,
      status as string | undefined,
      sort as string | undefined,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
  });

  getProviders = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, sort, page, limit } = req.query;
    const result = await this._adminService.getProviders(
      search as string | undefined,
      status as string | undefined,
      sort as string | undefined,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
  });

  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req.params.id);
    const { status } = req.body;
    const updated = await this._adminService.updateUserStatus(id, status);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(updated, "Status updated"));
  });

  unblockUser = asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req.params.id);
    const updated = await this._adminService.unblockUser(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(updated, "User unblocked"));
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req.params.id);
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
    const id = paramId(req.params.id);
    await this._adminService.deleteService(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Service deleted"));
  });

  getPendingProviders = asyncHandler(async (req: Request, res: Response) => {
    const pending = await this._adminService.getPendingProviders();
    res.status(HttpStatusCode.OK).json(createSuccessResponse(pending));
  });

  getProviderDetail = asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req.params.id);
    const detail = await this._adminService.getProviderDetail(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(detail));
  });

  verifyProvider = asyncHandler(async (req: Request, res: Response) => {
    const providerId = paramId(req.params.providerId);
    const { status, reason, remarks } = req.body as {
      status: "approved" | "rejected";
      reason?: string;
      remarks?: string;
    };
    await this._adminService.verifyProvider(providerId, status, remarks ?? reason);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Verification status updated"));
  });

  getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const { timeRange } = req.query;
    const stats = await this._adminService.getDashboardStats(timeRange as string | undefined);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(stats));
  });

  getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
    const { timeRange } = req.query;
    const revenue = await this._adminService.getRevenueReport(timeRange as string | undefined);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(revenue));
  });

  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;
    const reports = await this._adminService.getAllReports(
      status as string | undefined,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(reports));
  });

  resolveReport = asyncHandler(async (req: Request, res: Response) => {
    const reportId = paramId(req.params.reportId);
    const { action, resolutionNotes } = req.body;
    const resolved = await this._adminService.resolveReport(reportId, action, resolutionNotes);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(resolved, "Report resolved"));
  });

  getAllBookings = asyncHandler(async (req: Request, res: Response) => {
    const { search, status, sort, page, limit } = req.query;
    const result = await this._adminService.getAllBookings(
      search as string | undefined,
      status as string | undefined,
      sort as string | undefined,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 10
    );
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
  });

  getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req.params.id);
    const booking = await this._adminService.getBookingById(id);
    res.status(HttpStatusCode.OK).json(createSuccessResponse(booking));
  });
}