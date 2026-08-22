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
      startDate: a.startDate,
      endDate: a.endDate,
      weeklySchedule: (a.weeklySchedule || []).map((s) => ({
        day: s.day,
        isAvailable: s.isAvailable,
        slots: (s.slots || []).map((slot) => ({
          start: slot.start,
          end: slot.end,
        })),
      })),
      dateOverrides: (a.dateOverrides || []).map((o) => ({
        date: o.date,
        isAvailable: o.isAvailable,
        slots: (o.slots || []).map((slot) => ({
          start: slot.start,
          end: slot.end,
        })),
      })),
      slots: (a.slots || []).map((slot) => ({
        start: slot.start,
        end: slot.end,
      })),
      createdAt: new Date(a.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(a.updatedAt || Date.now()).toISOString(),
    };
  }
}
