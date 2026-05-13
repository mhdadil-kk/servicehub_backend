import { Request, Response, NextFunction } from "express";
import { ServiceRepository } from "../repositories/service.repository";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";

export class ServiceController {
  private _serviceRepository: ServiceRepository;

  constructor() {
    this._serviceRepository = new ServiceRepository();
  }

  getActiveServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const services = await this._serviceRepository.findActive();
      res.status(HttpStatusCode.OK).json(createSuccessResponse(services));
    } catch (error) {
      next(error);
    }
  };
}
