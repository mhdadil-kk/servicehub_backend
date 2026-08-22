import { ServiceResponseDTO, GetApprovedProvidersOptionsDTO, GetApprovedProvidersResultDTO } from "../../dtos/service.dto";

export interface IServiceService {
  getActiveService(): Promise<ServiceResponseDTO[]>;
  getApprovedProviders(options: GetApprovedProvidersOptionsDTO): Promise<GetApprovedProvidersResultDTO>;
}
