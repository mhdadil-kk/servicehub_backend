import { Request, Response, NextFunction } from "express";
import { IServiceService } from "../interfaces/services/IServiceService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { ServiceMapper } from "../mappers/service.mapper";
import { ProviderProfileMapper } from "../mappers/providerProfile.mapper";

export class ServiceController {
  private _serviceService: IServiceService;

  constructor(serviceService: IServiceService) {
    this._serviceService = serviceService;
  }

  getActiveServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await this._serviceService.getActiveService();
      res.status(HttpStatusCode.OK).json(createSuccessResponse(ServiceMapper.toArrayResponse(services)));
    } catch (error) {
      next(error);
    }
  };

  getApprovedProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, serviceId, latitude, longitude, radius, limit, page, sortBy, sortOrder } = req.query;

      const result = await this._serviceService.getApprovedProviders({
        search: search as string,
        serviceId: serviceId as string,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        radius: radius ? Number(radius) : undefined,
        limit: Number(limit) || 10,
        page: Number(page) || 1,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
      });

      res.status(HttpStatusCode.OK).json(createSuccessResponse({
        providers: ProviderProfileMapper.toArrayResponse(result.providers, true),
        total: result.total,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit
      }));
    } catch (error) {
      next(error);
    }
  };
}
