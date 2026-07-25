import { BaseRepository } from "./base.repository";
import Service, { IService } from "../models/service.model";
import { IServiceRepository } from "../interfaces/repositories/IServiceRepository";

export class ServiceRepository extends BaseRepository<IService> implements IServiceRepository {
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

    return services.map((s: any) => s._id.toString());
  }
}
