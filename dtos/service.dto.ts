import { ProviderProfileResponseDTO } from "./provider.dto";

export interface ServiceResponseDTO {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface GetApprovedProvidersOptionsDTO {
  search?: string;
  serviceId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface GetApprovedProvidersResultDTO {
  providers: ProviderProfileResponseDTO[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
