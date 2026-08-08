import { IService } from "../../types/service.types";
import { IProviderProfile } from "../../types/providerProfile.types"


export interface GetApprovedProvidersOptions {
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


export interface GetApprovedProvidersResult {
    providers: IProviderProfile[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
}

export interface IServiceService {
    getActiveService(): Promise<IService[]>;
    getApprovedProviders(options: GetApprovedProvidersOptions): Promise<GetApprovedProvidersResult>;
}