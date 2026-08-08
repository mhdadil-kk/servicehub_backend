import mongoose from "mongoose";


export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string, includeDeleted?: boolean): Promise<T | null>;
  findOne(filter: mongoose.FilterQuery<T>, includeDeleted?: boolean): Promise<T | null>;
  update(id: string, data: mongoose.UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  findAll(
    filter?: mongoose.FilterQuery<T>,
    includeDeleted?: boolean,
    sort?: Record<string, mongoose.SortOrder>,
    limit?: number,
    skip?: number
  ): Promise<T[]>;
  count(filter?: mongoose.FilterQuery<T>, includeDeleted?: boolean): Promise<number>;
}
