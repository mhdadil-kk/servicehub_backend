import { FilterQuery, UpdateQuery } from "mongoose";

export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string, includeDeleted?: boolean): Promise<T | null>;
  findOne(filter: FilterQuery<T>, includeDeleted?: boolean): Promise<T | null>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>; 
  findAll(filter?: FilterQuery<T>, includeDeleted?: boolean, sort?: Record<string, number>, limit?: number, skip?: number): Promise<T[]>;
  count(filter?: FilterQuery<T>, includeDeleted?: boolean): Promise<number>;
}
