import { BaseRepository } from "./base.repository";
import Service, { IServiceDocument } from "../models/service.model";
import { IServiceRepository } from "../interfaces/repositories/IServiceRepository";
import mongoose from "mongoose";

export class ServiceRepository extends BaseRepository<IServiceDocument> implements IServiceRepository {
  constructor() {
    super(Service);
  }

  async findActive() {
    return await this.model.find({ isActive: true });
  }

  async findIdsByName(name: string): Promise<string[]> {
    const services = await this.model.find({
      name: { $regex: name, $options: "i" }
    }).select("_id").exec();

    return services.map((s: { _id: mongoose.Types.ObjectId }) => s._id.toString());
  }
}
