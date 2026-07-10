import { IService } from "../models/service.model";

export interface ServiceResponseDTO {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export class ServiceMapper {
  static toResponse(service: IService | any): ServiceResponseDTO | null {
    if (!service) return null;

    const s = typeof service.toObject === 'function' ? service.toObject() : service;

    return {
      _id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      description: s.description,
      isActive: s.isActive,
      createdAt: new Date(s.createdAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(services: any[]): ServiceResponseDTO[] {
    return services.map(service => this.toResponse(service)!);
  }
}
