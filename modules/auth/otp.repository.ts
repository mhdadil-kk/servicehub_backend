import { OTPModel, IOTP } from "./otp.model";
import { BaseRepository, IRepository } from "../common/base.repository";

/**
 * ABSTRACTION: IOTPRepository Interface
 * Contract for OTP-specific data access.
 */
export interface IOTPRepository extends IRepository<IOTP> {
  findLatest(userId: string, type: string): Promise<IOTP | null>;
  deleteByUserId(userId: string): Promise<void>;
}

/**
 * OTP REPOSITORY
 * Inherits generic CRUD and implements specialized methods for OTP lifecycle.
 */
export class OTPRepository extends BaseRepository<IOTP> implements IOTPRepository {
  constructor() {
    // CONSTRUCTOR: Injecting the Model
    super(OTPModel);
  }

  async findLatest(userId: string, type: string): Promise<IOTP | null> {
    // Find the most recent record, sorted by creation date (implicitly handled by TTL if needed)
    return await this.model.findOne({ user_id: userId, type }).sort({ _id: -1 }).exec();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ user_id: userId }).exec();
  }
}
