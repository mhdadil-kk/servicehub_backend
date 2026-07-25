import {IService} from "../../models/service.model"
import { IProviderProfile } from "../../types/providerProfile.types"


export interface GetApprovedProvidersOptions {
    search?: string;
    serviceId?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    limit?: number;
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