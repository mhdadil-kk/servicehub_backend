import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
  }).passthrough(),
});

export const ServiceDetailsSchema = z.object({
  body: z.object({
    serviceId: z.union([
      z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Service ID"),
      z.object({ _id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Service ID") }).transform((v) => v._id),
    ]),
    hourlyRate: z.coerce.number().min(1, "Hourly rate must be at least 1"),
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
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    weeklySchedule: z.any().optional(),
    overrides: z.array(z.any()).optional(),
  }).passthrough(),
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
    email?: string;
    phone?: string;
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
  weeklySchedule: Record<string, DayScheduleDTO>;
  overrides?: DateOverrideDTO[];
  createdAt: string;
  updatedAt: string;
}