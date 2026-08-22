import { IService } from "../types/service.types";
import { ServiceResponseDTO } from "../dtos/service.dto";

export class ServiceMapper {
  static toResponse(service: (IService & { toObject?: () => IService }) | null): ServiceResponseDTO | null {
    if (!service) return null;

    const s = typeof service.toObject === 'function' ? service.toObject() : service;

    return {
      _id: s._id?.toString() || s.id || "",
      name: s.name,
      slug: s.slug,
      description: s.description,
      isActive: s.isActive,
      createdAt: new Date(s.createdAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(services: (IService & { toObject?: () => IService })[]): ServiceResponseDTO[] {
    return services.map(service => this.toResponse(service)!);
  }
}
