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
}
