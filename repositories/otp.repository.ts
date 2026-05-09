import { OTPModel, IOTP } from "../models/otp.model";
import { BaseRepository } from "../repositories/base.repository";
import { IRepository } from "./IRepository";


export interface IOTPRepository extends IRepository<IOTP> {
  findLatest(userId: string, type: string): Promise<IOTP | null>;
  deleteByUserId(userId: string): Promise<void>;
}


export class OTPRepository extends BaseRepository<IOTP> implements IOTPRepository {
  constructor() {
    super(OTPModel);
  }

  async findLatest(userId: string, type: string): Promise<IOTP | null> {
    return await this.model.findOne({ user_id: userId, type }).sort({ _id: -1 }).exec();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ user_id: userId }).exec();
  }
}
