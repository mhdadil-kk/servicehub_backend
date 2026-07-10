import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../interfaces/services/IAdminService";
import { createSuccessResponse } from "../types/response";
import { UserMapper } from "../mappers/user.mapper";
import { ServiceMapper } from "../mappers/service.mapper";
import { ProviderProfileMapper } from "../mappers/providerProfile.mapper";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class AdminController {
  private _adminService: IAdminService;

  constructor(adminService: IAdminService) {
    this._adminService = adminService;
  }


  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string; 
      const sort = req.query.sort as string;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 3;
      
      const { users, total } = await this._adminService.getAllUsers(search, status, sort, page, limit);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ 
        users: UserMapper.toResponse(users),
        total,
        page,
        limit
      }));
    } catch (error: unknown) {
      next(error);
    }
  };


  getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string; 
      const sort = req.query.sort as string;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      
      const { providers, total } = await this._adminService.getProviders(search, status, sort, page, limit);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ 
        providers: UserMapper.toResponse(providers),
        total,
        page,
        limit
      }));
    } catch (error: unknown) {
      next(error);
    } 
  };


  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const { status } = req.body;

      const user = await this._adminService.updateUserStatus(id, status);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ user: UserMapper.toResponse(user) }, SUCCESS_MESSAGES.USER_UPDATED));
    } catch (error: unknown) {
      next(error);
    }
  };


  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this._adminService.unblockUser(id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ user: UserMapper.toResponse(user) }, SUCCESS_MESSAGES.USER_UNBLOCKED));
    } catch (error: unknown) {
      next(error);
    }
  };


  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      await this._adminService.deleteUser(id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, SUCCESS_MESSAGES.USER_DELETED));
    } catch (error: unknown) {
      next(error);
    }
  };

  addService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const service = await this._adminService.addService(req.body);
      res.status(HttpStatusCode.CREATED).json(createSuccessResponse(ServiceMapper.toResponse(service), SUCCESS_MESSAGES.SERVICE_CATEGORY_CREATED));
    } catch (error: unknown) {
      next(error);
    }
  };

  getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await this._adminService.getAllServices();
      res.status(HttpStatusCode.OK).json(createSuccessResponse(ServiceMapper.toArrayResponse(services)));
    } catch (error: unknown) {
      next(error);
    }
  };

  deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      await this._adminService.deleteService(id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, SUCCESS_MESSAGES.SERVICE_CATEGORY_DELETED));
    } catch (error: unknown) {
      next(error);
    }
  };


  getProviderDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = await this._adminService.getProviderDetail(req.params.id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(ProviderProfileMapper.toResponse(provider)));
    } catch (error: unknown) {
      next(error);
    }
  };

  verifyProvider = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const { status, remarks } = req.body;
      await this._adminService.verifyProvider(id, status, remarks);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, `Provider ${status} successfully`));
    } catch (error: unknown) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const stats = await this._adminService.getDashboardStats(timeRange);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(stats, SUCCESS_MESSAGES.DASHBOARD_STATS_FETCHED));
    } catch (error: unknown) {
      next(error);
    }
  };

  getAllBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const sort = req.query.sort as string;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      
      const { bookings, total } = await this._adminService.getAllBookings(search, status, sort, page, limit);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({
        bookings,
        total,
        page,
        limit
      }));
    } catch (error: unknown) {
      next(error);
    }
  };

  getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this._adminService.getBookingById(req.params.id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(booking));
    } catch (error: unknown) {
      next(error);
    }
  };
}

