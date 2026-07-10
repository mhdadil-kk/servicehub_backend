import { IProviderAvailability } from "../types/providerProfile.types";

export interface TimeSlotDTO {
  id: string;
  start: string;
  end: string;
  startDate?: string;
  endDate?: string;
  rrule?: string;
}

export interface DayScheduleDTO {
  isAvailable: boolean;
  slots: TimeSlotDTO[];
}

export interface DateOverrideDTO {
  id: string;
  date: string;
  isAvailable: boolean;
  slots: TimeSlotDTO[];
}

export interface ProviderAvailabilityResponseDTO {
  _id: string;
  providerId: string;
  startDate?: string;
  endDate?: string;
  weeklySchedule: {
    Monday: DayScheduleDTO;
    Tuesday: DayScheduleDTO;
    Wednesday: DayScheduleDTO;
    Thursday: DayScheduleDTO;
    Friday: DayScheduleDTO;
    Saturday: DayScheduleDTO;
    Sunday: DayScheduleDTO;
  };
  overrides: DateOverrideDTO[];
  createdAt: string;
  updatedAt: string;
}

export class ProviderAvailabilityMapper {
  static toResponse(availability: IProviderAvailability | any): ProviderAvailabilityResponseDTO | null {
    if (!availability) return null;

    const a = typeof availability.toObject === 'function' ? availability.toObject() : availability;

    return {
      _id: a._id.toString(),
      providerId: a.providerId.toString(),
      startDate: a.startDate,
      endDate: a.endDate,
      weeklySchedule: a.weeklySchedule || {
        Monday: { isAvailable: false, slots: [] },
        Tuesday: { isAvailable: false, slots: [] },
        Wednesday: { isAvailable: false, slots: [] },
        Thursday: { isAvailable: false, slots: [] },
        Friday: { isAvailable: false, slots: [] },
        Saturday: { isAvailable: false, slots: [] },
        Sunday: { isAvailable: false, slots: [] },
      },
      overrides: a.overrides || [],
      createdAt: new Date(a.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(a.updatedAt || Date.now()).toISOString(),
    };
  }
}
