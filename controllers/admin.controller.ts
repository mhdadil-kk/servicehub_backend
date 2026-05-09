import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../services/admin.service";
import { createSuccessResponse } from "../types/response";
import { UserMapper } from "../mappers/user.mapper";
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
      const limit = Number(req.query.limit) || 10;
      
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
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ user: UserMapper.toResponse(user) }, "User unblocked successfully"));
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



}
