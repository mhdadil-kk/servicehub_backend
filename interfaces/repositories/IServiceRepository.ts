import { IService } from "../../models/service.model";

export interface IServiceRepository {
  findActive(): Promise<IService[]>;
  findIdsByName(name: string): Promise<string[]>;
  findAll(filter?: any, includeDeleted?: boolean): Promise<IService[]>;
  findOne(filter: any, includeDeleted?: boolean): Promise<IService | null>;
  findById(id: string): Promise<IService | null>;
  create(data: Partial<IService>): Promise<IService>;
  update(id: string, data: Partial<IService>): Promise<IService | null>;
  softDelete(id: string): Promise<boolean>;
}
