import mongoose, {  Model, Document, } from "mongoose";
import { IRepository } from "../interfaces/repositories/IRepository";


export abstract class BaseRepository<T extends Document> implements IRepository<T> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save();
  }

  async findById(id: string, includeDeleted = false): Promise<T | null> {
    const query: mongoose.FilterQuery<T> = { _id: id } as mongoose.FilterQuery<T>;
    if (!includeDeleted) {
      Object.assign(query, { isDeleted: { $ne: true } });
    }
    return this.model.findOne(query).exec();
  }

  async findOne(filter: mongoose.FilterQuery<T>, includeDeleted = false): Promise<T | null> {
    const query: mongoose.FilterQuery<T> = { ...filter };
    if (!includeDeleted) {
      Object.assign(query, { isDeleted: { $ne: true } });
    }
    return this.model.findOne(query).exec();
  }

  async update(id: string, data: mongoose.UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: "after" })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.model
      .findByIdAndUpdate(id, { isDeleted: true } as mongoose.UpdateQuery<T>, { returnDocument: "after" })
      .exec();
    return !!result;
  }

  async findAll(
    filter: mongoose.FilterQuery<T> = {} as mongoose.FilterQuery<T>,
    includeDeleted = false,
    sort?: Record<string, mongoose.SortOrder>,
    limit?: number,
    skip?: number
  ): Promise<T[]> {
    const query: mongoose.FilterQuery<T> = { ...filter };
    if (!includeDeleted) {
      Object.assign(query, { isDeleted: { $ne: true } });
    }
    let mongoQuery = this.model.find(query);
    if (sort)  mongoQuery = mongoQuery.sort(sort);
    if (skip)  mongoQuery = mongoQuery.skip(skip);
    if (limit) mongoQuery = mongoQuery.limit(limit);
    return mongoQuery.exec();
  }

  async count(filter: mongoose.FilterQuery<T> = {} as mongoose.FilterQuery<T>, includeDeleted = false): Promise<number> {
    const query: mongoose.FilterQuery<T> = { ...filter };
    if (!includeDeleted) {
      Object.assign(query, { isDeleted: { $ne: true } });
    }
    return this.model.countDocuments(query).exec();
  }
}
