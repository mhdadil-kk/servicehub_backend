import { Request, Response, NextFunction } from "express";
import { ServiceRepository } from "../repositories/service.repository";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import ProviderProfile from "../models/providerProfile.model";
import User from "../models/user.model";
import Service from "../models/service.model";

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

  getApprovedProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, serviceId, latitude, longitude, radius } = req.query;

      const query: any = { onboardingStatus: "approved" };

      if (serviceId) {
        query.serviceId = serviceId;
      }

      if (search) {
        const matchingUsers = await User.find({
          role: "provider",
          name: { $regex: search as string, $options: "i" }
        }).select("_id");
        
        const userIds = matchingUsers.map(u => u._id);

        const matchingServices = await Service.find({
          name: { $regex: search as string, $options: "i" }
        }).select("_id");
        
        const serviceIds = matchingServices.map(s => s._id);

        query.$or = [
          { userId: { $in: userIds } },
          { serviceId: { $in: serviceIds } }
        ];
      }

      if (latitude && longitude && radius) {
  query.location = {
    $geoWithin: {
      $centerSphere: [
        [Number(longitude), Number(latitude)],
        Number(radius) / 6378.1 
      ]
    }
  };
}

    // Pagination parameters
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const sortParams: any = {};
    if (sortBy === "hourlyRate") {
      sortParams.hourlyRate = sortOrder;
    } else {
      sortParams[sortBy] = sortOrder;
    }
 
    const [providers, total] = await Promise.all([
      ProviderProfile.find(query)
        .populate("userId", "name email phone role status")
        .populate("serviceId", "name description")
        .sort(sortParams)
        .limit(limit)
        .skip(skip)
        .exec(),
      ProviderProfile.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    res.status(HttpStatusCode.OK).json(createSuccessResponse({ providers, total, totalPages, page, limit }));

    } catch (error) {
      next(error);
    }
  };
}
