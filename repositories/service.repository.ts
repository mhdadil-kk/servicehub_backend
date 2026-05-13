import { BaseRepository } from "./base.repository";
import Service, { IService } from "../models/service.model";

export class ServiceRepository extends BaseRepository<IService> {
  constructor() {
    super(Service);
  }

  async findActive() {
    return await this.model.find({ isActive: true });
  }
}
