import { IService } from "../../models/service.model";

export interface IServiceRepository {
  findActive(): Promise<IService[]>;
}
