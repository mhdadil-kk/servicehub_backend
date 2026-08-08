import { IService } from "../../types/service.types";
import mongoose from "mongoose";

export interface IServiceRepository {
  findActive(): Promise<IService[]>;
  findIdsByName(name: string): Promise<string[]>;
  findAll(filter?: mongoose.FilterQuery<IService>, includeDeleted?: boolean): Promise<IService[]>;
  findOne(filter: mongoose.FilterQuery<IService>, includeDeleted?: boolean): Promise<IService | null>;
  findById(id: string): Promise<IService | null>;
  create(data: Partial<IService>): Promise<IService>;
  update(id: string, data: Partial<IService>): Promise<IService | null>;
  softDelete(id: string): Promise<boolean>;
}
