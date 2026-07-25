import { IServiceService, GetApprovedProvidersOptions, GetApprovedProvidersResult } from "../interfaces/services/IServiceService";
import { IServiceRepository } from "../interfaces/repositories/IServiceRepository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IProviderProfileRepository } from "../interfaces/repositories/IProviderProfileRepository";
import { IService } from "../models/service.model";

export class ServiceService implements IServiceService {
    constructor(
        private _serviceRepository: IServiceRepository,
        private _userRepository: IUserRepository,
        private _providerProfileRepository: IProviderProfileRepository
    ){}

    async getActiveService(): Promise<IService[]> {
        return this._serviceRepository.findActive();
    }

    async getApprovedProviders(options: GetApprovedProvidersOptions): Promise<GetApprovedProvidersResult> {
        const { search, serviceId, latitude, longitude, radius, limit = 10, page = 1, sortBy = "createdAt", sortOrder = "desc" } = options;
        const skip = (page - 1) * limit;

        let userIds: string[] | undefined;
        let serviceIds: string[] | undefined;

        if (search) {
            userIds = await this._userRepository.findIdsByRoleAndName("provider", search);
            serviceIds = await this._serviceRepository.findIdsByName(search);
        }

        const result = await this._providerProfileRepository.findApprovedProviders({
            serviceId,
            latitude,
            longitude,
            radius,
            limit,
            skip,
            sortBy,
            sortOrder: sortOrder === "asc" ? 1 : -1,
            userIds,
            serviceIds
        });

        const totalPages = Math.ceil(result.total / limit) || 1;

        return {
            providers: result.providers,
            total: result.total,
            totalPages,
            page,
            limit
        };
    }
}