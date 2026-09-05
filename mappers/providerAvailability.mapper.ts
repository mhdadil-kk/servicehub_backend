import { IProviderAvailability } from "../types/providerProfile.types";
import { ProviderAvailabilityResponseDTO } from "../dtos/provider.dto";

export class ProviderAvailabilityMapper {
  static toResponse(
    availability: (IProviderAvailability & { toObject?: () => IProviderAvailability }) | null
  ): ProviderAvailabilityResponseDTO | null {
    if (!availability) return null;

    const a = typeof availability.toObject === "function" ? availability.toObject() : availability;

    return {
      providerId: a.providerId ? a.providerId.toString() : "",
      isAvailable: a.isAvailable ?? true,
      startDate: a.startDate || "",
      endDate: a.endDate || "",
      weeklySchedule: a.weeklySchedule || {},
      overrides: a.overrides || [],
      createdAt: new Date(a.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(a.updatedAt || Date.now()).toISOString(),
    };
  }
}