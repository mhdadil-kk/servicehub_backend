import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../services/admin.service";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class AdminController {
  private adminService: IAdminService;

  constructor(adminService: IAdminService) {
    this.adminService = adminService;
  }


  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string; 
      const sort = req.query.sort as string;     
      const users = await this.adminService.getAllUsers(search,status,sort);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ users }));
    } catch (error: unknown) {
      next(error);
    }
  };


  getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string; 
      const sort = req.query.sort as string;  
      const providers = await this.adminService.getProviders(search,status,sort);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ providers }));
    } catch (error: unknown) {
      next(error);
    }
  };


  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const { status } = req.body;

      const user = await this.adminService.updateUserStatus(id, status);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ user }, SUCCESS_MESSAGES.USER_UPDATED));
    } catch (error: unknown) {
      next(error);
    }
  };


  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const user = await this.adminService.unblockUser(id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse({ user }, "User unblocked successfully"));
    } catch (error: unknown) {
      next(error);
    }
  };


  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      await this.adminService.deleteUser(id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, SUCCESS_MESSAGES.USER_DELETED));
    } catch (error: unknown) {
      next(error);
    }
  };



}
