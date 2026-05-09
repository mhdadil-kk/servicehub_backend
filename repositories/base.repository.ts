import { Model, Document, FilterQuery, UpdateQuery } from "mongoose";

import { IRepository } from "./IRepository";


export abstract class BaseRepository<T extends Document> implements IRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return await entity.save();
  }

  async findById(id: string, includeDeleted: boolean = false): Promise<T | null> {
    const query = { _id: id } as FilterQuery<T>;
    if (!includeDeleted) {
      Object.assign(query as object, { isDeleted: { $ne: true } });
    }
    return await this.model.findOne(query).exec();
  }

  async findOne(filter: FilterQuery<T>, includeDeleted: boolean = false): Promise<T | null> {
    const query = { ...filter } as FilterQuery<T>;
    if (!includeDeleted) {
      Object.assign(query as object, { isDeleted: { $ne: true } });
    }
    return await this.model.findOne(query).exec();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndUpdate(id, { isDeleted: true } as UpdateQuery<T>).exec();
    return !!result;
  }

  async findAll(filter: FilterQuery<T> = {}, includeDeleted: boolean = false, sort?: Record<string, number>, limit?: number, skip?: number): Promise<T[]> {
    const query = { ...filter } as FilterQuery<T>;
    if (!includeDeleted) {
      Object.assign(query as object, { isDeleted: { $ne: true } });
    }

    let mongoQuery = this.model.find(query);
    if(sort){
      mongoQuery = mongoQuery.sort(sort);
    }
    if(skip){
      mongoQuery = mongoQuery.skip(skip);
    }
    if(limit){
      mongoQuery = mongoQuery.limit(limit);
    }

    return await mongoQuery.exec();
  }

  async count(filter: FilterQuery<T> = {}, includeDeleted: boolean = false): Promise<number> {
    const query = { ...filter } as FilterQuery<T>;
    if (!includeDeleted) {
      Object.assign(query as object, { isDeleted: { $ne: true } });
    }
    return await this.model.countDocuments(query).exec();
  }
}
