import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long").optional(),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
    bio: z.string().min(20, "Bio should be at least 20 characters long").optional(),
    serviceRadius: z.string().transform(val => Number(val)).optional(), 
    address: z.string().min(5, "Address must be at least 5 characters long").optional(),
    latitude: z.string().transform(val => Number(val)).optional(),
    longitude: z.string().transform(val => Number(val)).optional(),
  })
});

export const ServiceDetailsSchema = z.object({
  body: z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Service ID"),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
  })
});

export const DocumentUploadSchema = z.object({
  body: z.object({
  }).optional()
});

export const LocationUpdateSchema = z.object({
  body: z.object({
    address: z.string().min(5).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    serviceRadius: z.coerce.number().min(1).optional(),
  }),
});

export const BankDetailsSchema = z.object({
  body: z.object({
    accountHolderName: z.string().min(1),
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    routingNumber: z.string().min(1),
  }),
});

export const UpdateAvailabilitySchema = z.object({
  body: z.object({
    days: z.array(z.string()).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
});

export interface ProviderDocumentDTO {
  docType: string;
  url: string;
}

export interface ProviderProfileResponseDTO {
  _id: string;
  userId: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    profilePhoto?: string;
  } | string;
  serviceId?: {
    _id?: string;
    name?: string;
    description?: string;
  } | string;
  bio?: string;
  profilePhoto?: string;
  hourlyRate?: number;
  serviceRadius?: number;
  address?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  documents?: ProviderDocumentDTO[];
  onboardingStep: number;
  onboardingStatus: string;
  rejectionReason?: string;
  bankDetails?: Record<string, unknown>;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProviderProfileDTO {
  _id: string;
  userId: {
    _id?: string;
    name?: string;
    profilePhoto?: string;
  } | string;
  serviceId?: {
    _id?: string;
    name?: string;
  } | string;
  bio?: string;
  profilePhoto?: string;
  hourlyRate?: number;
  serviceRadius?: number;
  averageRating?: number;
  totalReviews?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
}

export interface TimeSlotDTO {
  start: string;
  end: string;
}

export interface DayScheduleDTO {
  day: string;
  isAvailable: boolean;
  slots: TimeSlotDTO[];
}

export interface DateOverrideDTO {
  date: string;
  isAvailable: boolean;
  slots: TimeSlotDTO[];
}

export interface ProviderAvailabilityResponseDTO {
  providerId: string;
  isAvailable: boolean;
  startDate?: string;
  endDate?: string;
  weeklySchedule: DayScheduleDTO[];
  dateOverrides: DateOverrideDTO[];
  slots: TimeSlotDTO[];
  createdAt: string;
  updatedAt: string;
}
